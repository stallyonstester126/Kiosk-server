import orderModel from '../models/order.model'

export default {
    findAllOrders: (filter: {
        status?: string
        paymentMethod?: string
        startDate?: string
        endDate?: string
        search?: string
        sortBy?: string
        sortDirection?: string
    } = {}) => {
        const query: Record<string, any> = {}

        if (filter.status && filter.status !== 'all') {
            query.status = filter.status
        }

        if (filter.paymentMethod && filter.paymentMethod !== 'all') {
            query.paymentMethod = filter.paymentMethod
        }

        if (filter.startDate || filter.endDate) {
            query.createdAt = {}
            if (filter.startDate) {
                query.createdAt.$gte = new Date(filter.startDate)
            }
            if (filter.endDate) {
                const end = new Date(filter.endDate)
                if (end.getHours() === 0 && end.getMinutes() === 0) {
                    end.setHours(23, 59, 59, 999)
                }
                query.createdAt.$lte = end
            }
        }

        if (filter.search) {
            const searchRegex = new RegExp(filter.search, 'i')
            query.$or = [
                { customerName: searchRegex },
                { orderNumber: searchRegex },
                { coupon_code: searchRegex }
            ]
        }

        const sortDir = filter.sortDirection === 'asc' ? 1 : -1
        const sortField = filter.sortBy || 'createdAt'

        return orderModel.find(query).sort({ [sortField]: sortDir }).lean()
    },

    findKitchenOrders: () => {
        // Active kitchen orders only, sorted FIFO (oldest first)
        return orderModel
            .find({ status: { $in: ['received', 'confirmed', 'preparing', 'ready'] } })
            .sort({ createdAt: 1 })
            .lean()
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