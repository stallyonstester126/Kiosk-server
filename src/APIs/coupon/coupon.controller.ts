import { NextFunction, Request, Response } from 'express'
import httpResponse from '../../handlers/httpResponse'
import httpError from '../../handlers/errorHandler/httpError'
import { validateSchema } from '../../utils/joi-validate'
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from './validation/coupon.validation'
import {
    createCouponService,
    updateCouponService,
    deleteCouponService,
    enableCouponService,
    disableCouponService,
    duplicateCouponService,
    validateCouponService,
    getAllCouponsService,
    getCouponByIdService
} from './coupon.service'
import { CustomError } from '../../utils/errors'
import asyncHandler from '../../handlers/async'
import { IAuthenticateRequest } from '../../types/types'
import { ICreateCouponBody, IUpdateCouponBody } from './coupon.interface'
import mongoose from 'mongoose'

export default {
    createCoupon: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const req = request as IAuthenticateRequest
            const { error, payload } = validateSchema<ICreateCouponBody>(createCouponSchema, request.body)
            if (error) {
                return httpError(next, error, request, 422)
            }

            const userId = req.authenticatedUser?._id?.toString()
            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                throw new CustomError('Authenticated user identity is invalid', 401)
            }
            const result = await createCouponService(payload, userId)
            if (result.success === true) {
                httpResponse(response, request, 201, 'Coupon created successfully', result.data)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    updateCoupon: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { error, payload } = validateSchema<IUpdateCouponBody>(updateCouponSchema, request.body)
            if (error) {
                return httpError(next, error, request, 422)
            }

            const { id } = request.params
            const result = await updateCouponService(id, payload)
            if (result.success === true) {
                httpResponse(response, request, 200, 'Coupon updated successfully', result.data)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    deleteCoupon: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { id } = request.params
            const result = await deleteCouponService(id)
            if (result.success === true) {
                httpResponse(response, request, 200, 'Coupon deleted successfully', result.data)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    enableCoupon: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { id } = request.params
            const result = await enableCouponService(id)
            if (result.success === true) {
                httpResponse(response, request, 200, 'Coupon enabled successfully', result.data)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    disableCoupon: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { id } = request.params
            const result = await disableCouponService(id)
            if (result.success === true) {
                httpResponse(response, request, 200, 'Coupon disabled successfully', result.data)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    duplicateCoupon: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { id } = request.params
            const result = await duplicateCouponService(id)
            if (result.success === true) {
                httpResponse(response, request, 201, 'Coupon duplicated successfully', result.data)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    validateCoupon: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { error, payload } = validateSchema<{ code: string; subtotal: number; customerName?: string }>(
                validateCouponSchema,
                request.body
            )
            if (error) {
                return httpError(next, error, request, 422)
            }

            const result = await validateCouponService(payload.code, payload.subtotal, payload.customerName)
            if (result.success === true) {
                httpResponse(response, request, 200, 'Coupon validation completed', result.data)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    getAllCoupons: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { status, discountType } = request.query
            const result = await getAllCouponsService(
                status ? String(status) : undefined,
                discountType ? String(discountType) : undefined
            )
            if (result.success === true) {
                httpResponse(response, request, 200, 'Coupons fetched successfully', result.data)
            }
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    getCouponById: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { id } = request.params
            const result = await getCouponByIdService(id)
            if (result.success === true) {
                httpResponse(response, request, 200, 'Coupon fetched successfully', result.data)
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
