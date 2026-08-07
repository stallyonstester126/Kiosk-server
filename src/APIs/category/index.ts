import { Router } from 'express'
import categoryController from './category.controller'
import rateLimiter from '../../middlewares/rateLimiter'
import authenticateAdmin from '../../middlewares/authenticateAdmin'
import requirePermission from '../../middlewares/requirePermission'

const router = Router()

// Both admin and staff with 'categories' permission can view categories
router.route('/').get(rateLimiter, requirePermission('categories'), categoryController.getAllCategories)
// Only admin can create/update/delete categories
router.route('/').post(authenticateAdmin, categoryController.createCategory)
router.route('/:id').get(rateLimiter, requirePermission('categories'), categoryController.getCategoryById)
router.route('/:id').put(authenticateAdmin, categoryController.updateCategory)
router.route('/:id').delete(authenticateAdmin, categoryController.deleteCategory)

export default router