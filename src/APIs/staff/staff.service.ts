import { CustomError } from '../../utils/errors'
import userRepository from '../user/_shared/repo/user.repository'
import hashing from '../../utils/hashing'
import { EUserRoles } from '../../constant/users'
import { ICreateStaffBody, IUpdateStaffBody } from './staff.interface'

export const getAllStaffService = async () => {
    const staff = await userRepository.findAllStaff()
    return { success: true, data: staff }
}

export const createStaffService = async (payload: ICreateStaffBody) => {
    // Check email uniqueness
    const existing = await userRepository.findUserByEmail(payload.email)
    if (existing) {
        throw new CustomError(`A user with email ${payload.email} already exists`, 409)
    }

    const hashedPassword = await hashing.hashPassword(payload.password)

    const staff = await userRepository.createUser({
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: EUserRoles.STAFF,
        // These fields are for the user self-registration flow and not applicable to staff.
        // Model defaults (null / false) are applied automatically by Mongoose.
        phoneNumber: { isoCode: '', countryCode: '', internationalNumber: '' },
        timezone: '',
        accountConfimation: { status: true, token: '', code: '', timestamp: null },
        passwordReset: { token: null, expiry: null, lastResetAt: null },
        lastLoginAt: null,
        consent: false
    })

    return {
        success: true,
        data: {
            _id: staff._id,
            name: staff.name,
            email: staff.email,
            role: staff.role
        }
    }
}

export const updateStaffService = async (id: string, payload: IUpdateStaffBody) => {
    const staff = await userRepository.findStaffById(id)
    if (!staff) {
        throw new CustomError('Staff member not found', 404)
    }

    if (payload.email) {
        const existing = await userRepository.findUserByEmail(payload.email)
        if (existing && String(existing._id) !== id) {
            throw new CustomError(`Email ${payload.email} is already in use`, 409)
        }
    }

    const updated = await userRepository.updateUserById(id, payload as Record<string, unknown>)
    return { success: true, data: updated }
}

export const updateStaffStatusService = async (id: string, isActive: boolean) => {
    const staff = await userRepository.findStaffById(id)
    if (!staff) {
        throw new CustomError('Staff member not found', 404)
    }

    const updated = await userRepository.updateUserById(id, { isActive })
    return { success: true, data: updated }
}

export const resetStaffPasswordService = async (id: string, newPassword: string) => {
    const staff = await userRepository.findStaffById(id)
    if (!staff) {
        throw new CustomError('Staff member not found', 404)
    }

    const hashedPassword = await hashing.hashPassword(newPassword)
    await userRepository.updateUserById(id, { password: hashedPassword })
    return { success: true, data: null }
}
