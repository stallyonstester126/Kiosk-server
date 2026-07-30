import responseMessage from '../../constant/responseMessage'
import { CustomError } from '../../utils/errors'
import orderRepository from './_shared/repo/order.repository'
import validate from './validation/validations'
import { calculateOrderTotal } from './order.utils'
import { ICreateOrderBody } from './order.interface'

export const createOrderService = async (payload: ICreateOrderBody) => {
    if (!payload.items || payload.items.length === 0) {
        throw new CustomError(responseMessage.order.EMPTY_ITEMS, 422)
    }

    // Server-side price calculation (ignore any client-provided prices)
    const { items: calculatedItems, subtotal, tax, total } = await calculateOrderTotal(payload.items)

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const order = await orderRepository.createOrder({
        orderNumber,
        orderType: payload.orderType,
        customerName: payload.customerName,
        paymentMethod: payload.paymentMethod || 'cash',
        items: calculatedItems,
        subtotal,
        tax,
        total
    })

    return {
        success: true,
        data: order
    }
}

export const getAllOrdersService = async (status?: string) => {
    const orders = await orderRepository.findAllOrders({ status })
    return {
        success: true,
        data: orders
    }
}

export const getOrderByIdService = async (id: string) => {
    await validate.orderNotFound(id)
    const order = await orderRepository.findOrderById(id)
    return {
        success: true,
        data: order
    }
}

export const updateOrderStatusService = async (id: string, status: string) => {
    await validate.orderNotFound(id)

    const validStatuses = ['received', 'preparing', 'ready', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
        throw new CustomError(responseMessage.order.INVALID_STATUS, 422)
    }

    const order = await orderRepository.updateOrderStatusById(id, status)
    return {
        success: true,
        data: order
    }
}