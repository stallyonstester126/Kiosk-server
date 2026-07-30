import joi from 'joi'

const customizationOptionSchema = joi.object({
    id: joi.string().required(),
    name: joi.string().required(),
    priceAdd: joi.number().min(0).required()
})

const customizationGroupSchema = joi.object({
    groupId: joi.string().required(),
    groupTitle: joi.string().required(),
    options: joi.array().items(customizationOptionSchema).required()
})

const orderItemSchema = joi.object({
    productId: joi.string().hex().length(24).required(),
    quantity: joi.number().integer().min(1).required(),
    customizations: joi.array().items(customizationGroupSchema).optional()
})

export const createOrderSchema = joi.object({
    orderType: joi.string().valid('eat-in', 'take-away').required(),
    customerName: joi.string().min(1).max(100).trim().required(),
    items: joi.array().items(orderItemSchema).min(1).required(),
    paymentMethod: joi.string().valid('cash', 'split').optional()
})

export const updateOrderStatusSchema = joi.object({
    status: joi.string().valid('received', 'preparing', 'ready', 'completed', 'cancelled').required()
})