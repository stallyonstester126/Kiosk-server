import mongoose from 'mongoose'

export interface ICoupon {
    _id?: mongoose.Types.ObjectId | string
    code: string
    description?: string | null
    discount_type: 'percentage' | 'fixed'
    percentage?: number | null
    fixed_amount?: number | null
    minimum_order?: number | null
    maximum_discount?: number | null
    usage_limit?: number | null
    used_count: number
    per_customer_limit?: number | null
    starts_at: Date | string
    expires_at: Date | string
    first_order_only: boolean
    stackable: boolean
    status: 'active' | 'inactive'
    created_by?: mongoose.Types.ObjectId | string | null
    isDeleted: boolean
    createdAt?: Date
    updatedAt?: Date
}

export interface ICreateCouponBody {
    code: string
    description?: string | null
    discount_type: 'percentage' | 'fixed'
    percentage?: number | null
    fixed_amount?: number | null
    minimum_order?: number | null
    maximum_discount?: number | null
    usage_limit?: number | null
    per_customer_limit?: number | null
    starts_at: string | Date
    expires_at: string | Date
    first_order_only?: boolean
    stackable?: boolean
    status?: 'active' | 'inactive'
}

export interface IUpdateCouponBody {
    code?: string
    description?: string | null
    discount_type?: 'percentage' | 'fixed'
    percentage?: number | null
    fixed_amount?: number | null
    minimum_order?: number | null
    maximum_discount?: number | null
    usage_limit?: number | null
    per_customer_limit?: number | null
    starts_at?: string | Date
    expires_at?: string | Date
    first_order_only?: boolean
    stackable?: boolean
    status?: 'active' | 'inactive'
}
