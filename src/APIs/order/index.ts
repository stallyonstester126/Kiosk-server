import { Router } from 'express'
import orderController from './order.controller'
import rateLimiter from '../../middlewares/rateLimiter'

const router = Router()

router.route('/').get(rateLimiter, orderController.getAllOrders)
router.route('/').post(orderController.createOrder)
router.route('/:id').get(rateLimiter, orderController.getOrderById)
router.route('/:id/status').patch(orderController.updateOrderStatus) // TODO: add authenticateAdmin middleware in Phase 3

export default router