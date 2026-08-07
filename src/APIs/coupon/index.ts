import { Router } from 'express'
import couponController from './coupon.controller'
import rateLimiter from '../../middlewares/rateLimiter'
import authenticateAdmin from '../../middlewares/authenticateAdmin'
import requirePermission from '../../middlewares/requirePermission'

const router = Router()

// Public checkout endpoints
router.route('/validate').post(rateLimiter, couponController.validateCoupon)

// Admin management endpoints (require coupons permission)
router.route('/').get(rateLimiter, requirePermission('coupons'), couponController.getAllCoupons)
router.route('/').post(authenticateAdmin, couponController.createCoupon)
router.route('/:id').get(rateLimiter, requirePermission('coupons'), couponController.getCouponById)
router.route('/:id').put(authenticateAdmin, couponController.updateCoupon)
router.route('/:id').delete(authenticateAdmin, couponController.deleteCoupon)
router.route('/:id/enable').patch(authenticateAdmin, couponController.enableCoupon)
router.route('/:id/disable').patch(authenticateAdmin, couponController.disableCoupon)
router.route('/:id/duplicate').post(authenticateAdmin, couponController.duplicateCoupon)

export default router
