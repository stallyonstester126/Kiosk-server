import joi from 'joi'
import { ICreateProductBody, IUpdateProductBody } from '../product.interface'

const customizationOptionSchema = joi.object({
    id: joi.string().required(),
    name: joi.string().required(),
    priceAdd: joi.number().min(0).required()
})

const customizationGroupSchema = joi.object({
    id: joi.string().required(),
    title: joi.string().required(),
    type: joi.string().valid('single', 'multiple').required(),
    required: joi.boolean().required(),
    options: joi.array().items(customizationOptionSchema).required()
})

export const createProductSchema = joi.object<ICreateProductBody, true>({
    name: joi.string().min(1).max(100).trim().required(),
    description: joi.string().max(500).optional().allow(''),
    price: joi.number().min(0).required(),
    category: joi.string().hex().length(24).required(),
    image: joi.string().required(),
    isActive: joi.boolean().optional(),
    customizations: joi.array().items(customizationGroupSchema).optional()
})

export const updateProductSchema = joi.object<IUpdateProductBody, true>({
    name: joi.string().min(1).max(100).trim().optional(),
    description: joi.string().max(500).optional().allow(''),
    price: joi.number().min(0).optional(),
    category: joi.string().hex().length(24).optional(),
    image: joi.string().optional(),
    isActive: joi.boolean().optional(),
    customizations: joi.array().items(customizationGroupSchema).optional()
})