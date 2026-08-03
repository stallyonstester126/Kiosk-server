import joi from 'joi'

export const createStaffSchema = joi.object({
    name: joi.string().min(2).max(72).trim().required(),
    email: joi.string().email().trim().lowercase().required(),
    password: joi.string().min(6).required()
})

export const updateStaffSchema = joi.object({
    name: joi.string().min(2).max(72).trim().optional(),
    email: joi.string().email().trim().lowercase().optional()
})

export const updateStaffStatusSchema = joi.object({
    isActive: joi.boolean().required()
})

export const resetStaffPasswordSchema = joi.object({
    password: joi.string().min(6).required()
})
