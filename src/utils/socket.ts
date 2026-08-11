import { Server as SocketServer } from 'socket.io'
import { Server as HttpServer } from 'http'
import logger from '../handlers/logger'
import jwt from './jwt'
import config from '../config/config'
import userRepository from '../APIs/user/_shared/repo/user.repository'
import { EUserRoles } from '../constant/users'
import { IDecryptedJwt } from '../types/types'

let io: SocketServer | null = null

const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
    if (!cookieHeader) return {}
    return cookieHeader.split(';').reduce((acc, curr) => {
        const [key, val] = curr.trim().split('=')
        if (key && val) {
            acc[key] = decodeURIComponent(val)
        }
        return acc
    }, {} as Record<string, string>)
}

export const initSocket = (server: HttpServer) => {
    const allowedOrigins = [
        'http://localhost:4000',
        'http://localhost:5000',
        'https://kiosk-admin-six.vercel.app',
        'https://kiosk-client-delta.vercel.app'
    ]
    if (process.env.CLIENT_URL) {
        allowedOrigins.push(process.env.CLIENT_URL)
    }

    io = new SocketServer(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true)
                } else {
                    callback(new Error('Not allowed by CORS'))
                }
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    })

    // Authentication middleware for Socket.io
    io.use(async (socket, next) => {
        try {
            const cookieHeader = socket.handshake.headers.cookie
            const cookies = parseCookies(cookieHeader)
            const token = cookies['admin_accessToken']

            if (!token) {
                logger.warn('Socket connection rejected: No admin_accessToken token provided')
                return next(new Error('Authentication error: No token'))
            }

            const decoded = jwt.verifyToken(token, config.TOKENS.ACCESS.SECRET) as IDecryptedJwt
            if (!decoded || !decoded.userId) {
                logger.warn('Socket connection rejected: Invalid token structure')
                return next(new Error('Authentication error: Invalid token'))
            }

            const user = await userRepository.findUserById(decoded.userId)
            if (!user || (user.role !== EUserRoles.ADMIN && user.role !== EUserRoles.STAFF)) {
                logger.warn(`Socket connection rejected: User not authorized (Role: ${user?.role})`)
                return next(new Error('Authentication error: Unauthorized'))
            }

            // Store authenticated user inside socket data object
            socket.data.user = user
            next()
        } catch (error) {
            logger.error('Socket authentication middleware error:', { meta: error })
            next(new Error('Authentication error'))
        }
    })

    io.on('connection', (socket) => {
        logger.info(`Socket client connected: ${socket.id} (User: ${socket.data.user?.name}, Role: ${socket.data.user?.role})`)

        socket.on('disconnect', () => {
            logger.info(`Socket client disconnected: ${socket.id}`)
        })
    })

    return io
}

export const getIo = (): SocketServer => {
    if (!io) {
        throw new Error('Socket.io has not been initialized yet.')
    }
    return io
}

export const emitNewOrder = (order: any) => {
    try {
        const ioInstance = getIo()
        ioInstance.emit('order:new', order)
        logger.info(`Emitted order:new event for Order #${order.orderNumber}`)
    } catch (error) {
        logger.error('Failed to emit order:new event:', { meta: error })
    }
}
