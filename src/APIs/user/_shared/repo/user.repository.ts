import userModel from '../models/user.model'
import { IUser } from '../types/users.interface'

export default {
    findUserByEmail: (email: string, select: string = '') => {
        return userModel.findOne({ email }).select(select).lean()
    },
    findUserById: (id: string) => {
        return userModel.findById(id).lean()
    },
    findUserByConfirmationTokenAndCode: (token: string, code: string) => {
        return userModel.findOne({
            'accountConfimation.token': token,
            'accountConfimation.code': code
        }).lean()
    },
    createUser: (payload: IUser) => {
        return userModel.create(payload)
    },
    updateUserById: (id: unknown, payload: Record<string, unknown>) => {
        return userModel.findByIdAndUpdate(id, payload, { new: true })
    }
}
