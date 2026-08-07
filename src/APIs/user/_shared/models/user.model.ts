import mongoose from 'mongoose'
import { IUser } from '../types/users.interface'
import { EUserRoles } from '../../../../constant/users'
import { PERMISSIONS } from '../../../../constant/permissions'

const userSchema = new mongoose.Schema<IUser>(
    {
        name: {
            type: String,
            minlength: 2,
            maxlength: 72,
            required: true
        },
        email: {
            type: String,
            unique: true,
            required: true
        },
        phoneNumber: {
            _id: false,
            isoCode: { type: String },
            countryCode: { type: String },
            internationalNumber: { type: String }
        },
        timezone: {
            type: String,
            required: false,
            default: null
        },
        password: {
            type: String,
            required: true,
            select: false
        },
        role: {
            type: String,
            default: EUserRoles.USER,
            enum: EUserRoles,
            required: true
        },
        permissions: {
            type: [String],
            enum: PERMISSIONS,
            default: []
        },
        isActive: {
            type: Boolean,
            default: true
        },
        accountConfimation: {
            _id: false,
            status: {
                type: Boolean,
                default: false,
                required: true
            },
            token: {
                type: String,
                default: null
            },
            code: {
                type: String,
                default: null
            },
            timestamp: {
                type: Date,
                default: null
            }
        },
        passwordReset: {
            _id: false,
            token: {
                type: String,
                default: null
            },
            expiry: {
                type: Number,
                default: null
            },
            lastResetAt: {
                type: Date,
                default: null
            }
        },
        lastLoginAt: {
            type: Date,
            default: null
        },
        consent: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    { timestamps: true }
)

export default mongoose.model<IUser>('User', userSchema)
