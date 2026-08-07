import { EUserRoles } from '../../../../constant/users'
import { Permission } from '../../../../constant/permissions'

export interface IUser {
    name: string
    email: string
    phoneNumber: {
        isoCode: string
        countryCode: string
        internationalNumber: string
    }
    timezone: string
    password: string
    role: EUserRoles
    permissions?: Permission[]
    isActive?: boolean
    accountConfimation: {
        status: boolean
        token: string
        code: string
        timestamp: Date | null
    }
    passwordReset: {
        token: string | null
        expiry: number | null
        lastResetAt: Date | null
    }
    lastLoginAt: Date | null
    consent: boolean
}

export interface IUserWithId extends IUser {
    _id: unknown
}
