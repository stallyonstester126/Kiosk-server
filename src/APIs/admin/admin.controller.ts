import { NextFunction, Request, Response } from 'express'
import httpResponse from '../../handlers/httpResponse'
import responseMessage from '../../constant/responseMessage'
import httpError from '../../handlers/errorHandler/httpError'
import { validateSchema } from '../../utils/joi-validate'
import { loginSchema } from './validation/validation.schema'
import { adminLoginService } from './admin.service'
import { CustomError } from '../../utils/errors'
import asyncHandler from '../../handlers/async'
import health from '../../utils/health'
import { EApplicationEnvironment } from '../../constant/application'
import config from '../../config/config'
import { IAdminLoginRequest } from './admin.interface'
import { IAuthenticateRequest } from '../../types/types'

export default {
    login: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { body } = request as IAdminLoginRequest

            // Payload validation
            const { error, payload } = validateSchema<IAdminLoginRequest['body']>(loginSchema, body)
            if (error) {
                return httpError(next, error, request, 422)
            }

            const isLoggedIn = await adminLoginService(payload)
            if (isLoggedIn.success === true) {
                // sending cookies
                const DOMAIN = health.getDomain()
                const isProd = config.ENV === EApplicationEnvironment.PRODUCTION
                response.cookie('admin_accessToken', isLoggedIn.accessToken, {
                    path: '/v1',
                    domain: DOMAIN,
                    sameSite: isProd ? 'none' : 'strict',
                    maxAge: 1000 * config.TOKENS.ACCESS.EXPIRY,
                    httpOnly: true,
                    secure: isProd
                })

                httpResponse(response, request, 200, responseMessage.auth.LOGIN_SUCCESSFUL, {
                    success: true,
                    admin: isLoggedIn.admin
                })
            }
        } catch (error) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    me: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { authenticatedUser } = request as unknown as IAuthenticateRequest
            httpResponse(response, request, 200, responseMessage.SUCCESS, authenticatedUser)
        } catch (error) {
            if (error instanceof CustomError) {
                httpError(next, error, request, error.statusCode)
            } else {
                httpError(next, error, request, 500)
            }
        }
    }),

    logout: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const DOMAIN = health.getDomain()
            const isProd = config.ENV === EApplicationEnvironment.PRODUCTION

            // Clearing cookies
            response.clearCookie('admin_accessToken', {
                path: '/v1',
                domain: DOMAIN,
                sameSite: isProd ? 'none' : 'strict',
                maxAge: 1000 * config.TOKENS.ACCESS.EXPIRY,
                httpOnly: true,
                secure: isProd
            })

            httpResponse(response, request, 200, responseMessage.SUCCESS, null)
        } catch (error) {
            httpError(next, error, request, 500)
        }
    })
}
