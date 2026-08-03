import { Request } from 'express'

export interface ICreateStaffBody {
    name: string
    email: string
    password: string
}

export interface IUpdateStaffBody {
    name?: string
    email?: string
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
