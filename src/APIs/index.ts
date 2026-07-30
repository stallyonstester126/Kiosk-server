import { Application } from 'express'
import { API_ROOT } from '../constant/application'

import General from './router'
import authRoutes from './user/authentication'
import userManagementRoutes from './user/management'
import categoryRoutes from './category'
import productRoutes from './product'
import orderRoutes from './order'

const App = (app: Application) => {
    app.use(`${API_ROOT}`, General)
    app.use(`${API_ROOT}`, authRoutes)
    app.use(`${API_ROOT}/user`, userManagementRoutes)
    app.use(`${API_ROOT}/categories`, categoryRoutes)
    app.use(`${API_ROOT}/products`, productRoutes)
    app.use(`${API_ROOT}/orders`, orderRoutes)
}

export default App