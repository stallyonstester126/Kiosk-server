import { NextFunction, Request, Response } from 'express'
import httpResponse from '../../handlers/httpResponse'
import responseMessage from '../../constant/responseMessage'
import httpError from '../../handlers/errorHandler/httpError'
import { validateSchema } from '../../utils/joi-validate'
import { createProductSchema, updateProductSchema } from './validation/validation.schema'
import { ICreateProductBody, IUpdateProductBody } from './_shared/types/product.interface'
import {
    createProductService,
    getAllProductsService,
    getProductByIdService,
    updateProductService,
    deleteProductService
} from './product.service'
import { CustomError } from '../../utils/errors'
import asyncHandler from '../../handlers/async'
import config from '../../config/config'

// Helper to construct image URL
const constructImageUrl = (filename: string): string => {
    return `${config.SERVER_URL}/uploads/${filename}`
}

export default {
    createProduct: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            // Check if image was uploaded (required for create)
            if (!request.file) {
                return httpError(next, new Error(responseMessage.product.INVALID_IMAGE), request, 422)
            }

            // Construct image URL
            const imageUrl = constructImageUrl(request.file.filename)

            // Build payload from form fields
            const payload: ICreateProductBody = {
                name: request.body.name,
                description: request.body.description || '',
                price: Number(request.body.price),
                category: request.body.category,
                image: imageUrl,
                isActive: request.body.isActive === 'true' || request.body.isActive === true,
                customizations: request.body.customizations ? JSON.parse(request.body.customizations) : []
            }

            // Validate payload
            const { error, payload: validatedPayload } = validateSchema<ICreateProductBody>(createProductSchema, payload)
            if (error) {
                return httpError(next, error, request, 422)
            }

            const result = await createProductService(validatedPayload)
            if (result.success === true) {
                httpResponse(response, request, 201, responseMessage.SUCCESS, result.data)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    getAllProducts: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { category } = request.query

            const result = await getAllProductsService(category as string | undefined)
            if (result.success === true) {
                httpResponse(response, request, 200, responseMessage.SUCCESS, result.data)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    getProductById: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { params } = request
            const { id } = params

            const result = await getProductByIdService(id)
            if (result.success === true) {
                httpResponse(response, request, 200, responseMessage.SUCCESS, result.data)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    updateProduct: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { params } = request
            const { id } = params

            // Prepare payload from form fields
            const payload: Partial<IUpdateProductBody> = {}

            if (request.body.name !== undefined) payload.name = request.body.name
            if (request.body.description !== undefined) payload.description = request.body.description
            if (request.body.price !== undefined) payload.price = Number(request.body.price)
            if (request.body.category !== undefined) payload.category = request.body.category
            if (request.body.isActive !== undefined) payload.isActive = request.body.isActive === 'true' || request.body.isActive === true

            // Handle image upload if provided
            if (request.file) {
                const imageUrl = constructImageUrl(request.file.filename)
                payload.image = imageUrl
            }

            if (request.body.customizations !== undefined) {
                payload.customizations = JSON.parse(request.body.customizations)
            }

            // Validate payload
            const { error, payload: validatedPayload } = validateSchema<IUpdateProductBody>(updateProductSchema, payload)
            if (error) {
                return httpError(next, error, request, 422)
            }

            const result = await updateProductService(id, validatedPayload)
            if (result.success === true) {
                httpResponse(response, request, 200, responseMessage.SUCCESS, result.data)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    deleteProduct: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { params } = request
            const { id } = params

            const result = await deleteProductService(id)
            if (result.success === true) {
                httpResponse(response, request, 200, responseMessage.SUCCESS, result.data)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    })
}