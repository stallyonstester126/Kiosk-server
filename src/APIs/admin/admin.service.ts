import responseMessage from '../../constant/responseMessage'
import { CustomError } from '../../utils/errors'
import query from '../user/_shared/repo/user.repository'
import hashing from '../../utils/hashing'
import jwt from '../../utils/jwt'
import config from '../../config/config'
import { EUserRoles } from '../../constant/users'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { IAdminLoginBody } from './admin.interface'
import logger from '../../handlers/logger'

dayjs.extend(utc)

export const adminLoginService = async (payload: IAdminLoginBody) => {
    const { email, password } = payload

    // 1. Check user exists
    const user = await query.findUserByEmail(email, 'name email role permissions password isActive')
    if (!user) {
        throw new CustomError(responseMessage.auth.INVALID_EMAIL_OR_PASSWORD, 400)
    }

    // 2. Validate password
    const isValidPassword = await hashing.comparePassword(password, user.password)
    if (!isValidPassword) {
        throw new CustomError(responseMessage.auth.INVALID_EMAIL_OR_PASSWORD, 400)
    }

    // 3. Verify role — accepts ADMIN or STAFF (not plain USER)
    if (user.role !== EUserRoles.ADMIN && user.role !== EUserRoles.STAFF) {
        throw new CustomError('Not authorized', 401)
    }

    // 4. Check if account is active (staff can be deactivated by admin)
    const userRecord = user as typeof user & { isActive?: boolean }
    if (userRecord.isActive === false) {
        throw new CustomError('Account is deactivated. Contact your administrator.', 403)
    }

    // 5. Generate token
    const accessToken = jwt.generateToken(
        { userId: user._id },
        config.TOKENS.ACCESS.SECRET,
        config.TOKENS.ACCESS.EXPIRY
    )

    // 6. Update last login
    await query.updateUserById(user._id, {
        lastLoginAt: dayjs().utc().toDate()
    })

    return {
        success: true,
        admin: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions || []
        },
        accessToken
    }
}

/**
 * Validates the target staff member and generates a JWT for impersonation.
 * Only the controller sets cookies — this service is pure business logic.
 *
 * @param adminId  - The authenticated admin's ID (for audit logging)
 * @param staffId  - The target staff member's ID
 */
export const impersonateStaffService = async (adminId: string, staffId: string) => {
    // 1. Fetch the target user
    const staff = await query.findStaffById(staffId)
    if (!staff) {
        throw new CustomError(responseMessage.impersonation.INVALID_TARGET, 404)
    }

    // 2. Confirm role is staff
    if (staff.role !== EUserRoles.STAFF) {
        throw new CustomError(responseMessage.impersonation.INVALID_TARGET, 403)
    }

    // 3. Confirm staff is active
    const staffRecord = staff as typeof staff & { isActive?: boolean }
    if (staffRecord.isActive === false) {
        throw new CustomError(responseMessage.impersonation.TARGET_INACTIVE, 403)
    }

    // 4. Generate a JWT for the staff user (same expiry as normal access token)
    const staffToken = jwt.generateToken(
        { userId: staff._id },
        config.TOKENS.ACCESS.SECRET,
        config.TOKENS.ACCESS.EXPIRY
    )

    // 5. Audit log
    logger.info('IMPERSONATION_STARTED', {
        meta: {
            action: 'impersonate',
            adminId: String(adminId),
            targetStaffId: String(staff._id),
            targetStaffEmail: staff.email,
            timestamp: new Date().toISOString()
        }
    })

    return {
        staffToken,
        staff: {
            _id: staff._id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            permissions: staff.permissions || []
        }
    }
}

