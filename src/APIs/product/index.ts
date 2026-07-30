import { Router } from 'express'
import productController from './product.controller'
import rateLimiter from '../../middlewares/rateLimiter'

const router = Router()

router.route('/').get(rateLimiter, productController.getAllProducts)
router.route('/').post(productController.createProduct) // TODO: add authenticateAdmin middleware in Phase 3
router.route('/:id').get(rateLimiter, productController.getProductById)
router.route('/:id').put(productController.updateProduct) // TODO: add authenticateAdmin middleware in Phase 3
router.route('/:id').delete(productController.deleteProduct) // TODO: add authenticateAdmin middleware in Phase 3

export default router