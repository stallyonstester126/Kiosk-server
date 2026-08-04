import responseMessage from '../../constant/responseMessage'
import { CustomError } from '../../utils/errors'
import orderRepository from './_shared/repo/order.repository'
import validate from './validation/validations'
import { calculateOrderTotal } from './order.utils'
import { ICreateOrderBody } from './order.interface'

// FIFO transition map: current status → allowed next statuses
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    received: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'preparing', 'cancelled'],
    preparing: ['completed', 'ready'],
    ready: ['completed'],
    completed: [],
    cancelled: []
}

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
        paymentStatus: payload.paymentStatus || 'pending',
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

/**
 * Returns active kitchen orders sorted by createdAt ASC (FIFO).
 * Excludes completed and cancelled orders from the kitchen view.
 */
export const getKitchenOrdersService = async () => {
    const orders = await orderRepository.findKitchenOrders()
    return {
        success: true,
        data: orders
    }
}

export const updateOrderStatusService = async (id: string, newStatus: string) => {
    const order = await orderRepository.findOrderById(id)
    if (!order) {
        throw new CustomError(responseMessage.NOT_FOUND('Order'), 404)
    }

    const currentStatus = order.status as string
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []

    if (!allowed.includes(newStatus)) {
        throw new CustomError(
            `Cannot transition order from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}`,
            422
        )
    }

    const updatedOrder = await orderRepository.updateOrderStatusById(id, newStatus)
    return {
        success: true,
        data: updatedOrder
    }
}