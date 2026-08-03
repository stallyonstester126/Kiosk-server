import { Router } from 'express'
import paymentController from './payment.controller'

const router = Router()

// POST /v1/payments/create-intent
// Creates a Stripe PaymentIntent and returns clientSecret to the kiosk client.
// No authentication required — mirrors POST /v1/orders which is also public.
router.route('/create-intent').post(paymentController.createPaymentIntent)

export default router
