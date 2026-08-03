import responseMessage from '../../../constant/responseMessage'
import { CustomError } from '../../../utils/errors'
import orderRepository from '../_shared/repo/order.repository'
import productRepository from '../../product/_shared/repo/product.repository'

export default {
    orderNotFound: async (id: string) => {
        const order = await orderRepository.findOrderById(id)
        if (!order) {
            throw new CustomError(responseMessage.NOT_FOUND('Order'), 404)
        }
    },

    validateItems: async (items: Array<{ productId: string }>) => {
        if (!items || items.length === 0) {
            throw new CustomError('Order must contain at least one item', 422)
        }

        for (const item of items) {
            const product = await productRepository.findProductById(item.productId)
            if (!product) {
                throw new CustomError(responseMessage.NOT_FOUND('Product'), 404)
            }
            if (!product.isActive) {
                throw new CustomError('Product is not available', 422)
            }
        }
    }
}