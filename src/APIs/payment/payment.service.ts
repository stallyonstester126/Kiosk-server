import Stripe from 'stripe'
import config from '../../config/config'
import { CustomError } from '../../utils/errors'
import { calculateOrderTotal } from '../order/order.utils'
import { ICreatePaymentIntentBody, IPaymentIntentResult } from './payment.interface'

// Lazily instantiate Stripe so a missing key only throws at call time
const getStripe = (): Stripe => {
    if (!config.STRIPE.SECRET_KEY) {
        throw new CustomError('Stripe is not configured', 500)
    }
    return new Stripe(config.STRIPE.SECRET_KEY, { apiVersion: '2026-07-29.dahlia' })
}

export const createPaymentIntentService = async (
    payload: ICreatePaymentIntentBody
): Promise<IPaymentIntentResult> => {
    if (!payload.items || payload.items.length === 0) {
        throw new CustomError('Order must contain at least one item', 422)
    }

    // Server-side price calculation — never trust client amounts
    const { total } = await calculateOrderTotal(payload.items)

    // Stripe expects the amount in smallest currency unit (cents for USD)
    const amountInCents = Math.round(total * 100)

    if (amountInCents < 50) {
        throw new CustomError('Order total is below the minimum chargeable amount', 422)
    }

    const stripe = getStripe()

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
            customerName: payload.customerName,
            orderType: payload.orderType
        }
    })

    if (!paymentIntent.client_secret) {
        throw new CustomError('Failed to create payment intent', 500)
    }

    return {
        clientSecret: paymentIntent.client_secret,
        amount: total
    }
}
