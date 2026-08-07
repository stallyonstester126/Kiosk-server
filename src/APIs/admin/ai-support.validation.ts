import joi from 'joi'

export interface IAiConversationMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface IAiSupportChatBody {
    message: string
    conversation?: IAiConversationMessage[]
    currentPath?: string
    conversationId?: string
}

const conversationMessageSchema = joi.object<IAiConversationMessage>({
    role: joi.string().valid('user', 'assistant').required(),
    content: joi.string().trim().min(1).max(2000).required()
})

export const aiSupportChatSchema = joi.object<IAiSupportChatBody>({
    message: joi.string().trim().min(1).max(2000).required(),
    conversation: joi.array().items(conversationMessageSchema).max(12).optional(),
    currentPath: joi.string().trim().max(200).pattern(/^\/dashboard(?:\/[-a-z]+)*$/).optional(),
    conversationId: joi.string().trim().max(128).optional()
})
