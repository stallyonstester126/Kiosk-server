import joi from 'joi'
import { IAdminLoginBody } from '../admin.interface'

export const loginSchema = joi.object<IAdminLoginBody, true>({
    email: joi.string().email().required(),
    password: joi
        .string()
        .min(8)
        .max(24)
        .regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/)
        .trim()
        .required()
})
