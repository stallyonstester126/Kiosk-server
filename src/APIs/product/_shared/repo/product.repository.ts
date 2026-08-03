import productModel from '../models/product.model'
import { IProduct, IUpdateProductBody } from '../types/product.interface'

export default {
    findAllProducts: (filter: { category?: string } = {}) => {
        const query: Record<string, unknown> = { isActive: true }
        if (filter.category) {
            query.category = filter.category
        }
        return productModel.find(query).populate('category', 'name').sort({ createdAt: -1 }).lean()
    },

    findProductById: (id: string) => {
        return productModel.findById(id).populate('category', 'name').lean()
    },

    findProductByName: (name: string) => {
        return productModel.findOne({ name, isActive: true }).lean()
    },

    createProduct: (payload: IProduct) => {
        return productModel.create(payload)
    },

    updateProductById: (id: string, payload: IUpdateProductBody) => {
        return productModel.findByIdAndUpdate(id, payload, { new: true })
    },

    deleteProductById: (id: string) => {
        return productModel.findByIdAndUpdate(id, { isActive: false }, { new: true })
    }
}
