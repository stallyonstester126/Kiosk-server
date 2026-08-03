import { Router } from 'express'
import productController from './product.controller'
import rateLimiter from '../../middlewares/rateLimiter'
import authenticateAdmin from '../../middlewares/authenticateAdmin'
import { uploadProductImage } from '../../middlewares/upload'

const router = Router()

router.route('/').get(rateLimiter, productController.getAllProducts)
router.route('/').post(authenticateAdmin, uploadProductImage, productController.createProduct)
router.route('/:id').get(rateLimiter, productController.getProductById)
router.route('/:id').put(authenticateAdmin, uploadProductImage, productController.updateProduct)
router.route('/:id').delete(authenticateAdmin, productController.deleteProduct)

export default router