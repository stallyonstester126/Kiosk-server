import { Router } from 'express'
import productController from './product.controller'
import rateLimiter from '../../middlewares/rateLimiter'
import { uploadProductImage } from '../../middlewares/upload'
import requirePermission from '../../middlewares/requirePermission'

const router = Router()

// Admin and staff with 'products' permission can view products
router.route('/').get(rateLimiter, requirePermission('products'), productController.getAllProducts)
router.route('/').post(requirePermission('products'), uploadProductImage, productController.createProduct)
router.route('/:id').get(rateLimiter, requirePermission('products'), productController.getProductById)
router.route('/:id').put(requirePermission('products'), uploadProductImage, productController.updateProduct)
router.route('/:id').delete(requirePermission('products'), productController.deleteProduct)

export default router
