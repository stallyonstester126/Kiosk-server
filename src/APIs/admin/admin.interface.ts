import { Request } from 'express'

export interface IAdminLoginBody {
    email: string
    password: string
}

export interface IAdminLoginRequest extends Request {
    body: IAdminLoginBody
}
