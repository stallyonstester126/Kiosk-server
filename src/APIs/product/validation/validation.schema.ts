import joi from 'joi'
import { ICreateProductBody, IUpdateProductBody } from '../product.interface'

const customizationOptionSchema = joi.object({
    id: joi.string().required(),
    name: joi.string().required(),
    priceAdd: joi.number().min(0).required()
    , isActive: joi.boolean().default(true)
    , displayOrder: joi.number().integer().min(0).default(0)
})

const customizationGroupSchema = joi.object({
    id: joi.string().required(),
    title: joi.string().required(),
    type: joi.string().valid('single', 'multiple').required(),
    required: joi.boolean().required(),
    minSelections: joi.number().integer().min(0).default(0),
    maxSelections: joi.number().integer().min(0).allow(null).optional(),
    isActive: joi.boolean().default(true),
    displayOrder: joi.number().integer().min(0).default(0),
    options: joi.array().items(customizationOptionSchema).required()
}).custom((value, helpers) => {
    const minimum = value.required ? Math.max(1, value.minSelections || 0) : (value.minSelections || 0)
    if (!value.title.trim()) return helpers.error('any.invalid')
    if (!value.options.length) return helpers.error('any.invalid')
    if (value.type === 'single' && value.maxSelections != null && value.maxSelections !== 1) return helpers.error('any.invalid')
    if (value.maxSelections != null && value.maxSelections < minimum) return helpers.error('any.invalid')
    if (new Set(value.options.map((option: { name: string }) => option.name.trim().toLowerCase())).size !== value.options.length) return helpers.error('any.invalid')
    return value
}, 'customization validation')

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
