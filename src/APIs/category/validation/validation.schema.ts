import joi from 'joi'
import { ICreateCategoryBody, IUpdateCategoryBody } from '../category.interface'

export const createCategorySchema = joi.object<ICreateCategoryBody, true>({
    name: joi.string().min(1).max(100).trim().required(),
    displayOrder: joi.number().min(0).optional(),
    isActive: joi.boolean().optional()
})

export const updateCategorySchema = joi.object<IUpdateCategoryBody, true>({
    name: joi.string().min(1).max(100).trim().optional(),
    displayOrder: joi.number().min(0).optional(),
    isActive: joi.boolean().optional()
})