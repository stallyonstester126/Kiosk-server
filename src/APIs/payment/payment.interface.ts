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
            groupTitle: string
            options: {
                id: string
                name: string
                priceAdd: number
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
