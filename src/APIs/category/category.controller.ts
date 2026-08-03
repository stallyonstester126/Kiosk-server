import { NextFunction, Request, Response } from 'express'
import httpResponse from '../../handlers/httpResponse'
import responseMessage from '../../constant/responseMessage'
import httpError from '../../handlers/errorHandler/httpError'
import { validateSchema } from '../../utils/joi-validate'
import { createCategorySchema, updateCategorySchema } from './validation/validation.schema'
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from './category.service'
import { CustomError } from '../../utils/errors'
import asyncHandler from '../../handlers/async'
import { ICreateCategoryBody, IUpdateCategoryBody } from './category.interface'

export default {
    createCategory: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { error, payload } = validateSchema<ICreateCategoryBody>(createCategorySchema, request.body as unknown)
            if (error) {
                return httpError(next, error, request, 422)
            }

            const result = await createCategory(payload)
            if (result.success === true) {
                httpResponse(response, request, 201, responseMessage.SUCCESS, result.category)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    getAllCategories: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const result = await getAllCategories()
            if (result.success === true) {
                httpResponse(response, request, 200, responseMessage.SUCCESS, result.categories)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    getCategoryById: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { params } = request
            const { id } = params

            const result = await getCategoryById(id)
            if (result.success === true) {
                httpResponse(response, request, 200, responseMessage.SUCCESS, result.category)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    updateCategory: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { params } = request
            const { id } = params

            const { error, payload } = validateSchema<IUpdateCategoryBody>(updateCategorySchema, request.body as unknown)
            if (error) {
                return httpError(next, error, request, 422)
            }

            const result = await updateCategory(id, payload)
            if (result.success === true) {
                httpResponse(response, request, 200, responseMessage.SUCCESS, result.category)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    deleteCategory: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { params } = request
            const { id } = params

            const result = await deleteCategory(id)
            if (result.success === true) {
                httpResponse(response, request, 200, responseMessage.SUCCESS, result.message)
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