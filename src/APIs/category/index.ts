import { Router } from 'express'
import categoryController from './category.controller'
import rateLimiter from '../../middlewares/rateLimiter'

const router = Router()

router.route('/').get(rateLimiter, categoryController.getAllCategories)
router.route('/').post(categoryController.createCategory) // TODO: add authenticateAdmin middleware in Phase 3
router.route('/:id').get(rateLimiter, categoryController.getCategoryById)
router.route('/:id').put(categoryController.updateCategory) // TODO: add authenticateAdmin middleware in Phase 3
router.route('/:id').delete(categoryController.deleteCategory) // TODO: add authenticateAdmin middleware in Phase 3

export default router