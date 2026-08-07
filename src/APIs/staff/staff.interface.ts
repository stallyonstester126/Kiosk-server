import { Request } from 'express'
import { Permission } from '../../constant/permissions'

export interface ICreateStaffBody {
    name: string
    email: string
    password: string
    permissions?: Permission[]
}

export interface IUpdateStaffBody {
    name?: string
    email?: string
    permissions?: Permission[]
}

export interface IUpdateStaffStatusBody {
    isActive: boolean
}

export interface IResetStaffPasswordBody {
    password: string
}

export interface ICreateStaffRequest extends Request {
    body: ICreateStaffBody
}

export interface IUpdateStaffRequest extends Request {
    body: IUpdateStaffBody
}

export interface IUpdateStaffStatusRequest extends Request {
    body: IUpdateStaffStatusBody
}

export interface IResetStaffPasswordRequest extends Request {
    body: IResetStaffPasswordBody
}

export interface IStaffWithPermissions {
    _id: string
    name: string
    email: string
    role: string
    permissions?: Permission[]
    isActive?: boolean
    lastLoginAt?: string | null
    createdAt: string
}
