import { Request } from 'express'

export interface ICreateStaffBody {
    name: string
    email: string
    password: string
    permissions?: string[]  // Array of permission strings like 'kitchen', 'products', etc.
}

export interface IUpdateStaffBody {
    name?: string
    email?: string
    permissions?: string[]
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
    permissions?: string[]
    isActive?: boolean
    lastLoginAt?: string | null
    createdAt: string
}
