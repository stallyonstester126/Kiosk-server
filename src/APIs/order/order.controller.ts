import { NextFunction, Request, Response } from 'express'
import httpResponse from '../../handlers/httpResponse'
import responseMessage from '../../constant/responseMessage'
import httpError from '../../handlers/errorHandler/httpError'
import { validateSchema } from '../../utils/joi-validate'
import { createOrderSchema, updateOrderStatusSchema } from './validation/validation.schema'
import {
    createOrderService,
    getAllOrdersService,
    getOrderByIdService,
    getKitchenOrdersService,
    updateOrderStatusService
} from './order.service'
import { CustomError } from '../../utils/errors'
import asyncHandler from '../../handlers/async'
import { ICreateOrderRequest, IUpdateOrderStatusRequest } from './order.interface'

export default {
    createOrder: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { error, payload } = validateSchema<ICreateOrderRequest['body']>(createOrderSchema, request.body)
            if (error) {
                return httpError(next, error, request, 422)
            }

            const result = await createOrderService(payload)
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

    getAllOrders: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { status } = request.query

            const result = await getAllOrdersService(status as string | undefined)
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

    getOrderById: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { params } = request
            const { id } = params

            const result = await getOrderByIdService(id)
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

    getKitchenOrders: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const result = await getKitchenOrdersService()
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

    updateOrderStatus: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { body } = request as IUpdateOrderStatusRequest

            const { error, payload } = validateSchema<IUpdateOrderStatusRequest['body']>(updateOrderStatusSchema, body)
            if (error) {
                return httpError(next, error, request, 422)
            }

            const { params } = request
            const { id } = params

            const result = await updateOrderStatusService(id, payload.status)
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