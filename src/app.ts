import express, { Application } from 'express'
import path from 'path'
import router from './APIs'
import errorHandler from './middlewares/errorHandler'
import notFound from './handlers/notFound'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app: Application = express()

//Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(cookieParser())
// CORS configuration – explicit allowlist (no wildcard) to support credentialed requests
const allowedOrigins = [
  'http://localhost:4000', // admin frontend
  'http://localhost:5000', // kiosk client frontend
];

if (process.env.CLIENT_URL) {
  // Include any additional origin set via environment (e.g., production URL)
  allowedOrigins.push(process.env.CLIENT_URL);
}

// Use the `origin` callback to validate incoming origins
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl) or from allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PUT', 'PATCH'],
    credentials: true,
  })
);
app.use(express.json())
app.use(express.static(path.join(__dirname, '../', 'public')))

//Router
// app.use('/v1', router)
router(app)

//404 handler
app.use(notFound)

//Handlers as Middlewares
app.use(errorHandler)

export default app
