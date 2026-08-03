import { NextFunction, Request, Response } from 'express'
import httpResponse from '../../handlers/httpResponse'
import responseMessage from '../../constant/responseMessage'
import httpError from '../../handlers/errorHandler/httpError'
import { validateSchema } from '../../utils/joi-validate'
import { createPaymentIntentSchema } from './validation/payment.validation'
import { createPaymentIntentService } from './payment.service'
import { CustomError } from '../../utils/errors'
import asyncHandler from '../../handlers/async'
import { ICreatePaymentIntentBody, ICreatePaymentIntentRequest } from './payment.interface'

export default {
    createPaymentIntent: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { error, payload } = validateSchema<ICreatePaymentIntentBody>(
                createPaymentIntentSchema,
                request.body
            )
            if (error) {
                return httpError(next, error, request, 422)
            }

            const result = await createPaymentIntentService(payload as ICreatePaymentIntentRequest['body'])
            httpResponse(response, request, 201, responseMessage.payment.INTENT_CREATED, result)
        } catch (error: unknown) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    })
}
