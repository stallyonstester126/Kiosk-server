import { NextFunction, Request, Response } from 'express'
import asyncHandler from '../../handlers/async'
import httpError from '../../handlers/errorHandler/httpError'
import httpResponse from '../../handlers/httpResponse'
import responseMessage from '../../constant/responseMessage'
import { CustomError } from '../../utils/errors'
import { getAllProductsService } from '../product/product.service'
import { getAllCategories } from '../category/category.service'

interface MenuProductRecord {
    _id: unknown
    name: string
    description?: string
    price: number
    category: { _id: unknown; name: string } | null
    image: string
    customizations?: unknown[]
}

interface MenuCategoryRecord {
    _id: unknown
    name: string
    displayOrder?: number
}

/**
 * Public, customer-facing menu endpoints. Responses deliberately exclude
 * management metadata while reusing the active-only product/category queries.
 */
export default {
    getProducts: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { category } = request.query
            const result = await getAllProductsService(category as string | undefined)

            const products = (result.data as MenuProductRecord[]).map((product) => ({
                _id: product._id,
                name: product.name,
                description: product.description || '',
                price: product.price,
                category: product.category ? {
                    _id: product.category._id,
                    name: product.category.name
                } : null,
                image: product.image,
                customizations: product.customizations || []
            }))

            httpResponse(response, request, 200, responseMessage.SUCCESS, products)
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    getCategories: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const result = await getAllCategories()

            const categories = (result.categories as MenuCategoryRecord[]).map((category) => ({
                _id: category._id,
                name: category.name,
                displayOrder: category.displayOrder
            }))

            httpResponse(response, request, 200, responseMessage.SUCCESS, categories)
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    })
}
