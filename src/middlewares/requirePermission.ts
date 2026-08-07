import { NextFunction, Request, Response } from 'express'
import jwt from '../utils/jwt'
import config from '../config/config'
import query from '../APIs/user/_shared/repo/user.repository'
import httpError from '../handlers/errorHandler/httpError'
import responseMessage from '../constant/responseMessage'
import asyncHandler from '../handlers/async'
import { Permission } from '../constant/permissions'

/**
 * Middleware factory that creates a permission-based authorization middleware.
 * Requires the user to have the specified permission.
 * 
 * @param requiredPermission - The permission string required (e.g., 'kitchen', 'products', 'sales-report')
 * @returns Express middleware function
 */
export const requirePermission = (requiredPermission: Permission) => {
  return asyncHandler(async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const req = request as any; // IAuthenticateRequest

      const { cookies } = req

      const { admin_accessToken } = cookies as {
        admin_accessToken: string | undefined
      }

      if (!admin_accessToken) {
        return httpError(next, new Error(responseMessage.UNAUTHORIZED), request, 401)
      }

      const { userId } = jwt.verifyToken(admin_accessToken, config.TOKENS.ACCESS.SECRET) as any

      const user = await query.findUserById(userId)
      if (!user) {
        return httpError(next, new Error(responseMessage.UNAUTHORIZED), request, 401)
      }

      // Admin has all permissions
      if (user.role === 'admin') {
        return next()
      }

      // Check if user has the required permission
      const userPermissions = user.permissions || []
      if (userPermissions.includes(requiredPermission)) {
        return next()
      }

      return httpError(next, new Error(`Permission denied: ${requiredPermission} required`), request, 403)
    } catch (error) {
      httpError(next, error, request, 500)
    }
  })
}

export default requirePermission
