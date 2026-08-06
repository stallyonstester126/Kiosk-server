import joi from 'joi'

export const createCouponSchema = joi.object({
    code: joi.string().trim().uppercase().required(),
    description: joi.string().trim().allow('', null).optional(),
    discount_type: joi.string().valid('percentage', 'fixed').required(),
    percentage: joi.number().min(1).max(100).allow(null).optional(),
    fixed_amount: joi.number().min(0).allow(null).optional(),
    minimum_order: joi.number().min(0).allow(null).optional(),
    maximum_discount: joi.number().min(0).allow(null).optional(),
    usage_limit: joi.number().integer().min(1).allow(null).optional(),
    per_customer_limit: joi.number().integer().min(1).allow(null).optional(),
    starts_at: joi.date().required(),
    expires_at: joi.date().greater(joi.ref('starts_at')).required(),
    first_order_only: joi.boolean().optional(),
    stackable: joi.boolean().optional(),
    status: joi.string().valid('active', 'inactive').optional()
})

export const updateCouponSchema = joi.object({
    code: joi.string().trim().uppercase().optional(),
    description: joi.string().trim().allow('', null).optional(),
    discount_type: joi.string().valid('percentage', 'fixed').optional(),
    percentage: joi.number().min(1).max(100).allow(null).optional(),
    fixed_amount: joi.number().min(0).allow(null).optional(),
    minimum_order: joi.number().min(0).allow(null).optional(),
    maximum_discount: joi.number().min(0).allow(null).optional(),
    usage_limit: joi.number().integer().min(1).allow(null).optional(),
    per_customer_limit: joi.number().integer().min(1).allow(null).optional(),
    starts_at: joi.date().optional(),
    expires_at: joi.date().greater(joi.ref('starts_at')).optional(),
    first_order_only: joi.boolean().optional(),
    stackable: joi.boolean().optional(),
    status: joi.string().valid('active', 'inactive').optional()
})

export const validateCouponSchema = joi.object({
    code: joi.string().trim().uppercase().required(),
    subtotal: joi.number().min(0).required(),
    customerName: joi.string().trim().allow('', null).optional()
})
