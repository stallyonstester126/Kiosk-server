import orderModel from '../models/order.model'

export default {
    findAllOrders: (filter: { status?: string } = {}) => {
        const query: Record<string, unknown> = {}
        if (filter.status) {
            query.status = filter.status
        }
        return orderModel.find(query).sort({ createdAt: -1 }).lean()
    },

    findOrderById: (id: string) => {
        return orderModel.findById(id).lean()
    },

    createOrder: (payload: Record<string, unknown>) => {
        return orderModel.create(payload)
    },

    updateOrderStatusById: (id: string, status: string) => {
        return orderModel.findByIdAndUpdate(id, { status }, { new: true }).lean()
    }
}