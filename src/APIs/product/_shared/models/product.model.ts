import mongoose from 'mongoose'
import { IProduct } from '../types/product.interface'

const customizationOptionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    priceAdd: { type: Number, required: true, min: 0 }
}, { _id: false })

const customizationGroupSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['single', 'multiple'], required: true },
    required: { type: Boolean, required: true },
    options: { type: [customizationOptionSchema], required: true }
}, { _id: false })

const productSchema = new mongoose.Schema<IProduct>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        description: {
            type: String,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true
        },
        image: {
            type: String,
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        customizations: {
            type: [customizationGroupSchema],
            default: []
        }
    },
    { timestamps: true }
)

export default mongoose.model<IProduct>('Product', productSchema)