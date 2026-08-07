import config from '../../config/config'
import { CustomError } from '../../utils/errors'
import { Permission } from '../../constant/permissions'
import { IAiConversationMessage } from './ai-support.validation'
import { buildAiSupportSystemPrompt } from './ai-support.prompt'

type GroqResponse = { choices?: Array<{ message?: { content?: string | null } }> }

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const TIMEOUT_MS = 30_000

export const getAiSupportReply = async (payload: { message: string; conversation?: IAiConversationMessage[]; currentPath?: string; conversationId?: string }, user: { role: string; permissions?: Permission[] }) => {
    if (!config.GROQ.API_KEY || !config.GROQ.MODEL) {
        throw new CustomError('AI support is not configured', 503)
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
        const systemPrompt = await buildAiSupportSystemPrompt(user, payload.currentPath)
        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.GROQ.API_KEY}`
            },
            body: JSON.stringify({
                model: config.GROQ.MODEL,
                stream: false,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...(payload.conversation || []),
                    { role: 'user', content: payload.message }
                ]
            }),
            signal: controller.signal
        })

        if (response.status === 429) throw new CustomError('AI support is temporarily rate limited. Please try again later.', 429)
        if (response.status === 401 || response.status === 403) throw new CustomError('AI support configuration is invalid', 503)
        if (!response.ok) throw new CustomError('AI support is temporarily unavailable', 502)

        const data = await response.json() as GroqResponse
        const message = data.choices?.[0]?.message?.content?.trim()
        if (!message) throw new CustomError('AI support returned an unexpected response', 502)
        return { message, conversationId: payload.conversationId || null }
    } catch (error) {
        if (error instanceof CustomError) throw error
        if (error instanceof Error && error.name === 'AbortError') throw new CustomError('AI support request timed out. Please try again.', 504)
        throw new CustomError('AI support is temporarily unavailable', 502)
    } finally {
        clearTimeout(timeout)
    }
}
