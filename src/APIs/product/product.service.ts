import mongoose from 'mongoose'
import productRepository from '../product/_shared/repo/product.repository'
import validate from './validation/validations'
import { ICreateProductBody, IUpdateProductBody } from './_shared/types/product.interface'

export const createProductService = async (payload: ICreateProductBody) => {
    await validate.productAlreadyExists(payload.name)
    await validate.categoryNotFound(payload.category)

    const newProduct = await productRepository.createProduct({
        ...payload,
        category: new mongoose.Types.ObjectId(payload.category)
    })
    return {
        success: true,
        data: newProduct
    }
}

export const getAllProductsService = async (categoryId?: string) => {
    const filter: { category?: string } = {}
    if (categoryId) {
        filter.category = categoryId
    }
    const products = await productRepository.findAllProducts(filter)
    return {
        success: true,
        data: products
    }
}

export const getProductByIdService = async (id: string) => {
    await validate.productNotFound(id)
    const product = await productRepository.findProductById(id)
    return {
        success: true,
        data: product
    }
}

export const updateProductService = async (id: string, payload: IUpdateProductBody) => {
    await validate.productNotFound(id)
    
    if (payload.category) {
        await validate.categoryNotFound(payload.category)
    }
    
    const product = await productRepository.updateProductById(id, payload)
    return {
        success: true,
        data: product
    }
}

export const deleteProductService = async (id: string) => {
    await validate.productNotFound(id)
    const product = await productRepository.deleteProductById(id)
    return {
        success: true,
        data: product
    }
}