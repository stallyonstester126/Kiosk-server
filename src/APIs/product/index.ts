import { Router } from 'express'
import productController from './product.controller'
import rateLimiter from '../../middlewares/rateLimiter'
import authenticateAdmin from '../../middlewares/authenticateAdmin'
import { uploadProductImage } from '../../middlewares/upload'
import requirePermission from '../../middlewares/requirePermission'

const router = Router()

// Admin and staff with 'products' permission can view products
router.route('/').get(rateLimiter, requirePermission('products'), productController.getAllProducts)
// Only admin can create/update/delete products
router.route('/').post(authenticateAdmin, uploadProductImage, productController.createProduct)
router.route('/:id').get(rateLimiter, requirePermission('products'), productController.getProductById)
router.route('/:id').put(authenticateAdmin, uploadProductImage, productController.updateProduct)
router.route('/:id').delete(authenticateAdmin, productController.deleteProduct)

export default router