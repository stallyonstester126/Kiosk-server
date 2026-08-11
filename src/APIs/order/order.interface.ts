import { Request } from 'express'
import mongoose from 'mongoose'

export interface IOrderCustomizationOption {
    id: string
    name: string
    priceAdd: number
}

export interface IOrderCustomizationGroup {
    groupId: string
    groupTitle: string
    options: IOrderCustomizationOption[]
}

export interface IOrderItem {
    productId: mongoose.Types.ObjectId
    name: string
    quantity: number
    basePrice: number
    customizations: IOrderCustomizationGroup[]
}

export interface IOrder {
    orderNumber: string
    orderType: 'eat-in' | 'take-away'
    customerName: string
    items: IOrderItem[]
    subtotal: number
    tax: number
    total: number
    paymentMethod: 'cash' | 'card'
    paymentStatus: 'pending' | 'paid' | 'failed'
    status: 'received' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    completedAt?: Date | null
}

export interface IOrderWithId extends IOrder {
    _id: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

export interface ICreateOrderBody {
    orderType: 'eat-in' | 'take-away'
    customerName: string
    paymentMethod?: 'cash' | 'card'
    paymentStatus?: 'pending' | 'paid' | 'failed'
    couponCode?: string
    items: {
        productId: string
        quantity: number
        customizations: {
            groupId: string
            options: {
                id: string
            }[]
        }[]
    }[]
}

export interface ICreateOrderRequest extends Request {
    body: ICreateOrderBody
}

export interface IUpdateOrderStatusPayload {
    status: 'received' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
}

export interface IUpdateOrderStatusRequest extends Request {
    params: {
        id: string
    }
    body: IUpdateOrderStatusPayload
}
