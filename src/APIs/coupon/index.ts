import { Router } from 'express'
import couponController from './coupon.controller'
import rateLimiter from '../../middlewares/rateLimiter'
import requirePermission from '../../middlewares/requirePermission'

const router = Router()

// Public checkout endpoints
router.route('/validate').post(rateLimiter, couponController.validateCoupon)

// Admin management endpoints (require coupons permission)
router.route('/').get(rateLimiter, requirePermission('coupons'), couponController.getAllCoupons)
router.route('/').post(requirePermission('coupons'), couponController.createCoupon)
router.route('/:id').get(rateLimiter, requirePermission('coupons'), couponController.getCouponById)
router.route('/:id').put(requirePermission('coupons'), couponController.updateCoupon)
router.route('/:id').delete(requirePermission('coupons'), couponController.deleteCoupon)
router.route('/:id/enable').patch(requirePermission('coupons'), couponController.enableCoupon)
router.route('/:id/disable').patch(requirePermission('coupons'), couponController.disableCoupon)
router.route('/:id/duplicate').post(requirePermission('coupons'), couponController.duplicateCoupon)

export default router
