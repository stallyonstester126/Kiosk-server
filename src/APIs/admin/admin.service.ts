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
