import mongoose from 'mongoose'

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        description: {
            type: String,
            default: null
        },
        discount_type: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: true
        },
        percentage: {
            type: Number,
            min: 1,
            max: 100,
            default: null
        },
        fixed_amount: {
            type: Number,
            min: 0,
            default: null
        },
        minimum_order: {
            type: Number,
            min: 0,
            default: null
        },
        maximum_discount: {
            type: Number,
            min: 0,
            default: null
        },
        usage_limit: {
            type: Number,
            min: 1,
            default: null
        },
        used_count: {
            type: Number,
            default: 0
        },
        per_customer_limit: {
            type: Number,
            min: 1,
            default: null
        },
        starts_at: {
            type: Date,
            required: true
        },
        expires_at: {
            type: Date,
            required: true
        },
        first_order_only: {
            type: Boolean,
            default: false
        },
        stackable: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
)

couponSchema.index({ code: 1 }, { unique: true })
couponSchema.index({ isDeleted: 1 })

export default mongoose.model('Coupon', couponSchema)
