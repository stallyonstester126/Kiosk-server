import { NextFunction, Request, Response } from 'express'
import { IAuthenticateRequest, IDecryptedJwt } from '../types/types'
import jwt from '../utils/jwt'
import config from '../config/config'
import query from '../APIs/user/_shared/repo/user.repository'
import httpError from '../handlers/errorHandler/httpError'
import responseMessage from '../constant/responseMessage'
import asyncHandler from '../handlers/async'
import { EUserRoles } from '../constant/users'

export default asyncHandler(async (request: Request, _response: Response, next: NextFunction) => {
    try {
        const req = request as IAuthenticateRequest

        const { cookies } = req

        const { admin_accessToken } = cookies as {
            admin_accessToken: string | undefined
        }

        if (admin_accessToken) {
            const { userId } = jwt.verifyToken(admin_accessToken, config.TOKENS.ACCESS.SECRET) as IDecryptedJwt

            const user = await query.findUserById(userId)
            if (user) {
                if (user.role === EUserRoles.ADMIN) {
                    req.authenticatedUser = user
                    return next()
                } else {
                    return httpError(next, new Error('Admin access required'), request, 403)
                }
            }
        }
        httpError(next, new Error(responseMessage.UNAUTHORIZED), request, 401)
    } catch (error) {
        httpError(next, error, request, 500)
    }
})
