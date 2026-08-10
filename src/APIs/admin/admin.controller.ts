import { NextFunction, Request, Response } from 'express'
import httpResponse from '../../handlers/httpResponse'
import responseMessage from '../../constant/responseMessage'
import httpError from '../../handlers/errorHandler/httpError'
import { validateSchema } from '../../utils/joi-validate'
import { loginSchema } from './validation/validation.schema'
import { adminLoginService, impersonateStaffService } from './admin.service'
import { CustomError } from '../../utils/errors'
import asyncHandler from '../../handlers/async'
import { EApplicationEnvironment } from '../../constant/application'
import config from '../../config/config'
import { IAdminLoginRequest } from './admin.interface'
import { IAuthenticateRequest } from '../../types/types'
import { aiSupportChatSchema, IAiSupportChatBody } from './ai-support.validation'
import { getAiSupportReply } from './ai-support.service'
import jwt from '../../utils/jwt'
import { IDecryptedJwt } from '../../types/types'
import query from '../user/_shared/repo/user.repository'
import logger from '../../handlers/logger'

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
                const isProd = config.ENV === EApplicationEnvironment.PRODUCTION
                response.cookie('admin_accessToken', isLoggedIn.accessToken, {
                    path: '/',
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
            const { _id, name, email, role, permissions, isActive, lastLoginAt } = authenticatedUser

            // Detect impersonation: if admin_impersonationToken cookie exists, this is an
            // impersonated session. We expose safe metadata (no tokens or secrets).
            const { cookies } = request
            const impersonationCookie = (cookies as Record<string, string | undefined>).admin_impersonationToken
            const isImpersonated = !!impersonationCookie

            httpResponse(response, request, 200, responseMessage.SUCCESS, {
                _id,
                name,
                email,
                role,
                permissions: permissions || [],
                isActive,
                lastLoginAt,
                impersonation: {
                    active: isImpersonated,
                    originalRole: isImpersonated ? 'admin' : null
                }
            })
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
            const isProd = config.ENV === EApplicationEnvironment.PRODUCTION

            const cookieOpts = {
                path: '/',
                sameSite: (isProd ? 'none' : 'strict') as 'none' | 'strict',
                maxAge: 1000 * config.TOKENS.ACCESS.EXPIRY,
                httpOnly: true,
                secure: isProd
            }

            // Clearing access token cookie
            response.clearCookie('admin_accessToken', cookieOpts)
            // Also clear any active impersonation token (full logout must clear everything)
            response.clearCookie('admin_impersonationToken', cookieOpts)

            httpResponse(response, request, 200, responseMessage.SUCCESS, null)
        } catch (error) {
            httpError(next, error, request, 500)
        }
    }),

    aiSupportChat: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { error, payload } = validateSchema<IAiSupportChatBody>(aiSupportChatSchema, request.body)
            if (error) return httpError(next, error, request, 422)
            const { authenticatedUser } = request as unknown as IAuthenticateRequest
            const result = await getAiSupportReply(payload, authenticatedUser)
            httpResponse(response, request, 200, responseMessage.SUCCESS, result)
        } catch (error) {
            httpError(next, error, request, error instanceof CustomError ? error.statusCode : 500)
        }
    }),

    /**
     * POST /admin/staff/:id/impersonate
     * Admin-only endpoint. Saves the current admin token and replaces admin_accessToken
     * with a JWT for the target staff member.
     */
    impersonateStaff: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { authenticatedUser } = request as unknown as IAuthenticateRequest
            const { cookies } = request
            const staffId = request.params.id

            // Guard: prevent stacking impersonation sessions
            const alreadyImpersonating = !!(cookies as Record<string, string | undefined>).admin_impersonationToken
            if (alreadyImpersonating) {
                return httpError(next, new Error(responseMessage.impersonation.ALREADY_IMPERSONATING), request, 400)
            }

            // Validate and get staff token
            const result = await impersonateStaffService(String(authenticatedUser._id), staffId)

            const isProd = config.ENV === EApplicationEnvironment.PRODUCTION
            const cookieOpts = {
                path: '/',
                sameSite: (isProd ? 'none' : 'strict') as 'none' | 'strict',
                maxAge: 1000 * config.TOKENS.ACCESS.EXPIRY,
                httpOnly: true,
                secure: isProd
            }

            // Save original admin token in impersonation cookie
            const currentAdminToken = (cookies as Record<string, string | undefined>).admin_accessToken as string
            response.cookie('admin_impersonationToken', currentAdminToken, cookieOpts)

            // Replace access token with staff token
            response.cookie('admin_accessToken', result.staffToken, cookieOpts)

            httpResponse(response, request, 200, responseMessage.impersonation.STARTED, {
                ...result.staff,
                impersonation: {
                    active: true,
                    originalRole: 'admin'
                }
            })
        } catch (error) {
            httpError(next, error, request, error instanceof CustomError ? (error as CustomError).statusCode : 500)
        }
    }),

    /**
     * POST /admin/impersonation/exit
     * Restores the original admin session by swapping tokens back.
     * Requires an active impersonation session (admin_impersonationToken cookie must exist).
     */
    exitImpersonation: asyncHandler(async (request: Request, response: Response, next: NextFunction) => {
        try {
            const { cookies } = request
            const impersonationToken = (cookies as Record<string, string | undefined>).admin_impersonationToken

            // Must have an active impersonation session
            if (!impersonationToken) {
                return httpError(next, new Error(responseMessage.impersonation.NOT_IMPERSONATING), request, 400)
            }

            // Verify the saved admin token is still valid and belongs to an admin
            let adminId: string
            try {
                const decoded = jwt.verifyToken(impersonationToken, config.TOKENS.ACCESS.SECRET) as IDecryptedJwt
                adminId = decoded.userId
            } catch {
                // Token expired or tampered — clear both cookies and force re-login
                const isProd = config.ENV === EApplicationEnvironment.PRODUCTION
                const cookieOpts = {
                    path: '/',
                    sameSite: (isProd ? 'none' : 'strict') as 'none' | 'strict',
                    httpOnly: true,
                    secure: isProd
                }
                response.clearCookie('admin_accessToken', cookieOpts)
                response.clearCookie('admin_impersonationToken', cookieOpts)
                return httpError(next, new Error(responseMessage.UNAUTHORIZED), request, 401)
            }

            const admin = await query.findUserById(adminId)
            if (!admin || admin.role !== 'admin') {
                return httpError(next, new Error(responseMessage.UNAUTHORIZED), request, 401)
            }

            const isProd = config.ENV === EApplicationEnvironment.PRODUCTION
            const cookieOpts = {
                path: '/',
                sameSite: (isProd ? 'none' : 'strict') as 'none' | 'strict',
                maxAge: 1000 * config.TOKENS.ACCESS.EXPIRY,
                httpOnly: true,
                secure: isProd
            }

            // Restore admin token
            response.cookie('admin_accessToken', impersonationToken, cookieOpts)
            // Clear impersonation token
            response.clearCookie('admin_impersonationToken', {
                path: '/',
                sameSite: isProd ? 'none' : 'strict',
                httpOnly: true,
                secure: isProd
            })

            // Audit log
            logger.info('IMPERSONATION_EXITED', {
                meta: {
                    action: 'exit_impersonation',
                    adminId: String(admin._id),
                    timestamp: new Date().toISOString()
                }
            })

            httpResponse(response, request, 200, responseMessage.impersonation.EXITED, {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions || [],
                impersonation: {
                    active: false,
                    originalRole: null
                }
            })
        } catch (error) {
            httpError(next, error, request, error instanceof CustomError ? (error as CustomError).statusCode : 500)
        }
    })
}
