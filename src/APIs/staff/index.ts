import { Router } from 'express'
import staffController from './staff.controller'
import authenticateAdmin from '../../middlewares/authenticateAdmin'
import rateLimiter from '../../middlewares/rateLimiter'

const router = Router()

// All staff management routes are admin-only
router.route('/').get(rateLimiter, authenticateAdmin, staffController.getAll)
router.route('/').post(rateLimiter, authenticateAdmin, staffController.create)
router.route('/:id').put(rateLimiter, authenticateAdmin, staffController.update)
router.route('/:id/status').patch(rateLimiter, authenticateAdmin, staffController.updateStatus)
router.route('/:id/password').patch(rateLimiter, authenticateAdmin, staffController.resetPassword)

export default router
