import responseMessage from '../../../constant/responseMessage'
import { CustomError } from '../../../utils/errors'
import productRepository from '../_shared/repo/product.repository'
import categoryRepository from '../../category/_shared/repo/category.repository'

export default {
    productAlreadyExists: async (name: string) => {
        const existingProduct = await productRepository.findProductByName(name)
        if (existingProduct) {
            throw new CustomError(responseMessage.product.ALREADY_EXISTS(name), 422)
        }
    },

    productNotFound: async (id: string) => {
        const product = await productRepository.findProductById(id)
        if (!product) {
            throw new CustomError(responseMessage.product.NOT_FOUND('Product'), 404)
        }
    },

    categoryNotFound: async (categoryId: string) => {
        const category = await categoryRepository.findCategoryById(categoryId)
        if (!category) {
            throw new CustomError(responseMessage.category.NOT_FOUND('Category'), 404)
        }
    }
}