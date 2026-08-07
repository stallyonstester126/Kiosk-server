import { Router } from 'express'
import categoryController from './category.controller'
import rateLimiter from '../../middlewares/rateLimiter'
import requirePermission from '../../middlewares/requirePermission'

const router = Router()

// Both admin and staff with 'categories' permission can view categories
router.route('/').get(rateLimiter, requirePermission('categories'), categoryController.getAllCategories)
router.route('/').post(requirePermission('categories'), categoryController.createCategory)
router.route('/:id').get(rateLimiter, requirePermission('categories'), categoryController.getCategoryById)
router.route('/:id').put(requirePermission('categories'), categoryController.updateCategory)
router.route('/:id').delete(requirePermission('categories'), categoryController.deleteCategory)

export default router
