import { Router } from 'express'
import orderController from './order.controller'
import rateLimiter from '../../middlewares/rateLimiter'
import authenticateAdmin from '../../middlewares/authenticateAdmin'
import requirePermission from '../../middlewares/requirePermission'

const router = Router()

// Admin-only: full order list with optional status filter
router.route('/').get(rateLimiter, requirePermission('transactions'), orderController.getAllOrders)

// Sales Report reads the same order data, but has its own permission boundary.
router.route('/sales-report').get(rateLimiter, requirePermission('sales-report'), orderController.getAllOrders)

// Public: kiosk creates orders (no auth)
router.route('/').post(orderController.createOrder)

// Admin + Staff with 'kitchen' permission: kitchen queue
router.route('/kitchen').get(rateLimiter, requirePermission('kitchen'), orderController.getKitchenOrders)

// Admin exports
router.route('/export/sales').get(rateLimiter, requirePermission('sales-report'), orderController.exportSalesReport)
router.route('/export/transactions').get(rateLimiter, requirePermission('transactions'), orderController.exportTransactionsReport)

// Admin-only: single order detail
router.route('/:id').get(rateLimiter, authenticateAdmin, orderController.getOrderById)

// Admin + Staff with 'kitchen' permission: update order status
router.route('/:id/status').patch(requirePermission('kitchen'), orderController.updateOrderStatus)

export default router
