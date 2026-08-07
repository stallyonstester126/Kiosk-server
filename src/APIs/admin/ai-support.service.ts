import config from '../../config/config'
import { CustomError } from '../../utils/errors'
import { Permission } from '../../constant/permissions'
import { IAiConversationMessage } from './ai-support.validation'
import { buildAiSupportSystemPrompt } from './ai-support.prompt'

type GroqResponse = { choices?: Array<{ message?: { content?: string | null } }> }

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const TIMEOUT_MS = 30_000

export const getAiSupportReply = async (payload: { message: string; conversation?: IAiConversationMessage[]; currentPath?: string; conversationId?: string }, user: { role: string; permissions?: Permission[] }) => {
    console.log('[AI Support Diagnostic] GROQ_API_KEY exists:', !!config.GROQ.API_KEY)
    console.log('[AI Support Diagnostic] GROQ_MODEL:', config.GROQ.MODEL)

    if (!config.GROQ.API_KEY || !config.GROQ.MODEL) {
        throw new CustomError('AI support is not configured', 503)
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
        console.log('[AI Support Diagnostic] Calling buildAiSupportSystemPrompt()...')
        const systemPrompt = await buildAiSupportSystemPrompt(user, payload.currentPath)
        console.log('[AI Support Diagnostic] buildAiSupportSystemPrompt() success. Prompt length:', systemPrompt.length)

        const messages = [
            { role: 'system', content: systemPrompt },
            ...(payload.conversation || []),
            { role: 'user', content: payload.message }
        ]
        console.log('[AI Support Diagnostic] Messages array is valid. Length:', messages.length)

        console.log('[AI Support Diagnostic] Sending request to Groq...')
        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.GROQ.API_KEY}`
            },
            body: JSON.stringify({
                model: config.GROQ.MODEL,
                stream: false,
                messages
            }),
            signal: controller.signal
        })

        console.log('[AI Support Diagnostic] Groq HTTP status:', response.status)

        if (response.status === 429) {
            console.error('[AI Support Diagnostic] Rate limited: 429')
            throw new CustomError('AI support is temporarily rate limited. Please try again later.', 429)
        }
        if (response.status === 401 || response.status === 403) {
            console.error('[AI Support Diagnostic] Auth failed:', response.status)
            throw new CustomError('AI support configuration is invalid', 503)
        }
        if (!response.ok) {
            const errText = await response.text()
            console.error('[AI Support Diagnostic] Groq response error/message:', errText)
            throw new CustomError('AI support is temporarily unavailable', 502)
        }

        const data = await response.json() as GroqResponse
        console.log('[AI Support Diagnostic] Groq response parsed successfully. Choice count:', data.choices?.length)
        const message = data.choices?.[0]?.message?.content?.trim()
        if (!message) {
            console.error('[AI Support Diagnostic] No message content in response. Keys of response:', Object.keys(data))
            throw new CustomError('AI support returned an unexpected response', 502)
        }
        return { message, conversationId: payload.conversationId || null }
    } catch (error) {
        console.error('[AI Support Diagnostic] Caught error in service:', error)
        if (error instanceof CustomError) throw error
        if (error instanceof Error && error.name === 'AbortError') throw new CustomError('AI support request timed out. Please try again.', 504)
        throw new CustomError('AI support is temporarily unavailable', 502)
    } finally {
        clearTimeout(timeout)
    }
}
