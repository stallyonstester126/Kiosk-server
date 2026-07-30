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

export default {
    createProduct: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { error, payload } = validateSchema<ICreateProductBody>(createProductSchema, request.body as unknown)
            if (error) {
                return httpError(next, error, request, 422)
            }

            const result = await createProductService(payload)
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

            const { error, payload } = validateSchema<IUpdateProductBody>(updateProductSchema, request.body as unknown)
            if (error) {
                return httpError(next, error, request, 422)
            }

            const result = await updateProductService(id, payload)
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