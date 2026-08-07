import { Router } from 'express'
import adminController from './admin.controller'
import authenticateAdminOrStaff from '../../middlewares/authenticateAdminOrStaff'
import authenticateAdmin from '../../middlewares/authenticateAdmin'
import rateLimiter from '../../middlewares/rateLimiter'

const router = Router()

// ─── Auth ───────────────────────────────────────────────────────────────────
router.route('/login').post(rateLimiter, adminController.login)
router.route('/me').get(rateLimiter, authenticateAdminOrStaff, adminController.me)
router.route('/logout').put(authenticateAdminOrStaff, adminController.logout)
router.route('/ai-support/chat').post(rateLimiter, authenticateAdminOrStaff, adminController.aiSupportChat)

// ─── Impersonation ──────────────────────────────────────────────────────────
// Only a real Admin can start impersonation
router.route('/staff/:id/impersonate').post(rateLimiter, authenticateAdmin, adminController.impersonateStaff)
// Exit can be called by admin or impersonated staff session; controller validates internally
router.route('/impersonation/exit').post(rateLimiter, authenticateAdminOrStaff, adminController.exitImpersonation)

export default router
