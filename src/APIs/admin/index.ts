import { Router } from 'express'
import adminController from './admin.controller'
import authenticateAdminOrStaff from '../../middlewares/authenticateAdminOrStaff'
import rateLimiter from '../../middlewares/rateLimiter'

const router = Router()

router.route('/login').post(rateLimiter, adminController.login)
router.route('/me').get(rateLimiter, authenticateAdminOrStaff, adminController.me)
router.route('/logout').put(authenticateAdminOrStaff, adminController.logout)

export default router
