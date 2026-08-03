import { Router } from 'express'
import adminController from './admin.controller'
import authenticateAdmin from '../../middlewares/authenticateAdmin'
import rateLimiter from '../../middlewares/rateLimiter'

const router = Router()

router.route('/login').post(rateLimiter, adminController.login)
router.route('/me').get(rateLimiter, authenticateAdmin, adminController.me)
router.route('/logout').put(authenticateAdmin, adminController.logout)

export default router
