import joi from 'joi'

const paymentItemSchema = joi.object({
    productId: joi.string().hex().length(24).required(),
    quantity: joi.number().integer().min(1).required(),
    customizations: joi.array().items(
        joi.object({
            groupId: joi.string().required(),
            options: joi.array().items(
                joi.object({
                    id: joi.string().required()
                })
            ).required()
        })
    ).optional()
})

export const createPaymentIntentSchema = joi.object({
    orderType: joi.string().valid('eat-in', 'take-away').required(),
    customerName: joi.string().min(1).max(100).trim().required(),
    items: joi.array().items(paymentItemSchema).min(1).required(),
    couponCode: joi.string().trim().uppercase().optional()
})
