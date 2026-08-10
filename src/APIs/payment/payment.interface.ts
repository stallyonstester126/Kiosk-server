import { Request } from 'express'

export interface ICreatePaymentIntentBody {
    orderType: 'eat-in' | 'take-away'
    customerName: string
    couponCode?: string
    items: {
        productId: string
        quantity: number
        customizations?: {
            groupId: string
            options: {
                id: string
            }[]
        }[]
    }[]
}

export interface ICreatePaymentIntentRequest extends Request {
    body: ICreatePaymentIntentBody
}

export interface IPaymentIntentResult {
    clientSecret: string
    amount: number
}
