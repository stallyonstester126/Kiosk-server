import { Router } from 'express'
import menuController from './menu.controller'
import rateLimiter from '../../middlewares/rateLimiter'

const router = Router()

// Public kiosk menu reads. Admin inventory routes remain under /products and /categories.
router.route('/products').get(rateLimiter, menuController.getProducts)
router.route('/categories').get(rateLimiter, menuController.getCategories)

export default router
