import { NextFunction, Request, Response } from 'express'
import httpResponse from '../../handlers/httpResponse'
import responseMessage from '../../constant/responseMessage'
import httpError from '../../handlers/errorHandler/httpError'
import { validateSchema } from '../../utils/joi-validate'
import { createStaffSchema, updateStaffSchema, updateStaffStatusSchema, resetStaffPasswordSchema } from './validation/staff.validation'
import {
    getAllStaffService,
    createStaffService,
    updateStaffService,
    updateStaffStatusService,
    resetStaffPasswordService
} from './staff.service'
import { CustomError } from '../../utils/errors'
import asyncHandler from '../../handlers/async'
import { ICreateStaffBody, IUpdateStaffBody, IUpdateStaffStatusBody, IResetStaffPasswordBody } from './staff.interface'

export default {
    getAll: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const result = await getAllStaffService()
            httpResponse(response, request, 200, responseMessage.SUCCESS, result.data)
        } catch (error) {
            httpError(next, error, request, error instanceof CustomError ? error.statusCode : 500)
        }
    }),

    create: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { error, payload } = validateSchema<ICreateStaffBody>(createStaffSchema, request.body)
            if (error) return httpError(next, error, request, 422)

            const result = await createStaffService(payload)
            httpResponse(response, request, 201, responseMessage.staff.CREATED, result.data)
        } catch (error) {
            httpError(next, error, request, error instanceof CustomError ? error.statusCode : 500)
        }
    }),

    update: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { error, payload } = validateSchema<IUpdateStaffBody>(updateStaffSchema, request.body)
            if (error) return httpError(next, error, request, 422)

            const result = await updateStaffService(request.params.id, payload)
            httpResponse(response, request, 200, responseMessage.SUCCESS, result.data)
        } catch (error) {
            httpError(next, error, request, error instanceof CustomError ? error.statusCode : 500)
        }
    }),

    updateStatus: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { error, payload } = validateSchema<IUpdateStaffStatusBody>(updateStaffStatusSchema, request.body)
            if (error) return httpError(next, error, request, 422)

            const result = await updateStaffStatusService(request.params.id, payload.isActive)
            httpResponse(response, request, 200, responseMessage.SUCCESS, result.data)
        } catch (error) {
            httpError(next, error, request, error instanceof CustomError ? error.statusCode : 500)
        }
    }),

    resetPassword: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { error, payload } = validateSchema<IResetStaffPasswordBody>(resetStaffPasswordSchema, request.body)
            if (error) return httpError(next, error, request, 422)

            const result = await resetStaffPasswordService(request.params.id, payload.password)
            httpResponse(response, request, 200, responseMessage.staff.PASSWORD_RESET, result.data)
        } catch (error) {
            httpError(next, error, request, error instanceof CustomError ? error.statusCode : 500)
        }
    })
}
