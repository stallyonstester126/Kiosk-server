import { Router } from 'express'
import categoryController from './category.controller'
import rateLimiter from '../../middlewares/rateLimiter'
import authenticateAdmin from '../../middlewares/authenticateAdmin'

const router = Router()

router.route('/').get(rateLimiter, categoryController.getAllCategories)
router.route('/').post(authenticateAdmin, categoryController.createCategory)
router.route('/:id').get(rateLimiter, categoryController.getCategoryById)
router.route('/:id').put(authenticateAdmin, categoryController.updateCategory)
router.route('/:id').delete(authenticateAdmin, categoryController.deleteCategory)

export default router