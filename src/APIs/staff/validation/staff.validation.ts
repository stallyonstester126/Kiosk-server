import joi from 'joi'
import { PERMISSIONS } from '../../../constant/permissions'

const permissionValues = PERMISSIONS

export const createStaffSchema = joi.object({
    name: joi.string().min(2).max(72).trim().required(),
    email: joi.string().email().trim().lowercase().required(),
    password: joi.string().min(6).required(),
    permissions: joi.array().items(joi.string().valid(...permissionValues)).unique().optional()
})

export const updateStaffSchema = joi.object({
    name: joi.string().min(2).max(72).trim().optional(),
    email: joi.string().email().trim().lowercase().optional(),
    permissions: joi.array().items(joi.string().valid(...permissionValues)).unique().optional()
})

export const updateStaffStatusSchema = joi.object({
    isActive: joi.boolean().required()
})

export const resetStaffPasswordSchema = joi.object({
    password: joi.string().min(6).required()
})
