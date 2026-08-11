import mongoose from 'mongoose'

const orderCustomizationOptionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    priceAdd: { type: Number, required: true, min: 0 }
}, { _id: false })

const orderCustomizationSchema = new mongoose.Schema({
    groupId: { type: String, required: true },
    groupTitle: { type: String, required: true },
    options: { type: [orderCustomizationOptionSchema], required: true }
}, { _id: false })

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    basePrice: { type: Number, required: true, min: 0 },
    customizations: { type: [orderCustomizationSchema], default: [] }
}, { _id: false })

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true
        },
        orderType: {
            type: String,
            enum: ['eat-in', 'take-away'],
            required: true
        },
        customerName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (v: unknown[]) => v.length > 0,
                message: 'Order must contain at least one item'
            }
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },
        tax: {
            type: Number,
            required: true,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
        },
        coupon_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Coupon',
            default: null
        },
        coupon_code: {
            type: String,
            default: null
        },
        discount_type: {
            type: String,
            default: null
        },
        discount_value: {
            type: Number,
            default: 0
        },
        discount_amount: {
            type: Number,
            default: 0
        },
        subtotal_before_discount: {
            type: Number,
            default: 0
        },
        subtotal_after_discount: {
            type: Number,
            default: 0
        },
        tax_after_discount: {
            type: Number,
            default: 0
        },
        grand_total: {
            type: Number,
            default: 0
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card'],
            default: 'cash'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending'
        },
        status: {
            type: String,
            enum: ['received', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
            default: 'received'
        },
        completedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
)

orderSchema.index({ orderNumber: 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index({ completedAt: -1 })

export default mongoose.model('Order', orderSchema)