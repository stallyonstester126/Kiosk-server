import { Application } from 'express'
import { API_ROOT } from '../constant/application'

import General from './router'
import authRoutes from './user/authentication'
import userManagementRoutes from './user/management'
import adminRoutes from './admin'
import categoryRoutes from './category'
import productRoutes from './product'
import orderRoutes from './order'
import paymentRoutes from './payment'
import staffRoutes from './staff'
import couponRoutes from './coupon'

const App = (app: Application) => {
    app.use(`${API_ROOT}`, General)
    app.use(`${API_ROOT}`, authRoutes)
    app.use(`${API_ROOT}/user`, userManagementRoutes)
    app.use(`${API_ROOT}/admin`, adminRoutes)
    app.use(`${API_ROOT}/categories`, categoryRoutes)
    app.use(`${API_ROOT}/products`, productRoutes)
    app.use(`${API_ROOT}/orders`, orderRoutes)
    app.use(`${API_ROOT}/payments`, paymentRoutes)
    app.use(`${API_ROOT}/staff`, staffRoutes)
    app.use(`${API_ROOT}/coupons`, couponRoutes)
}

export default App