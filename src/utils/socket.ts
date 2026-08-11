import { Server as SocketServer } from 'socket.io'
import { Server as HttpServer } from 'http'
import logger from '../handlers/logger'
import jwt from './jwt'
import config from '../config/config'
import userRepository from '../APIs/user/_shared/repo/user.repository'
import { EUserRoles } from '../constant/users'
import { IDecryptedJwt } from '../types/types'

let io: SocketServer | null = null

/**
 * Parse a raw Cookie header string into a key→value map.
 * Splits only on the FIRST '=' per cookie pair so that JWT tokens that contain
 * base64 padding characters ('=') are not truncated.
 */
const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
    if (!cookieHeader) return {}
    return cookieHeader.split(';').reduce(
        (acc, pair) => {
            const eqIdx = pair.indexOf('=')
            if (eqIdx === -1) return acc
            const key = pair.slice(0, eqIdx).trim()
            const val = pair.slice(eqIdx + 1).trim()
            if (key) acc[key] = val
            return acc
        },
        {} as Record<string, string>
    )
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
    if (process.env.ADMIN_URL) {
        allowedOrigins.push(process.env.ADMIN_URL)
    }

    io = new SocketServer(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true)
                } else {
                    logger.warn(`Socket CORS rejected origin: ${origin}`)
                    callback(new Error('Not allowed by CORS'))
                }
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    })

    // ── Authentication middleware ─────────────────────────────────────────────
    // Accepts the token via two mechanisms (in priority order):
    //   1. socket.handshake.auth.token  (sent explicitly by the Admin client)
    //   2. admin_accessToken cookie in the handshake Cookie header (fallback)
    io.use(async (socket, next) => {
        try {
            let token: string | undefined

            // 1. Explicit auth token from handshake (preferred)
            if (socket.handshake.auth && typeof socket.handshake.auth.token === 'string') {
                token = socket.handshake.auth.token
                logger.info(`Socket auth via handshake.auth.token (id: ${socket.id})`)
            }

            // 2. Fall back to cookie header
            if (!token) {
                const cookieHeader = socket.handshake.headers.cookie
                const cookies = parseCookies(cookieHeader)
                token = cookies['admin_accessToken']
                if (token) {
                    logger.info(`Socket auth via cookie header (id: ${socket.id})`)
                }
            }

            if (!token) {
                logger.warn(`Socket connection rejected — no token provided (id: ${socket.id})`)
                return next(new Error('Authentication error: No token'))
            }

            const decoded = jwt.verifyToken(token, config.TOKENS.ACCESS.SECRET) as IDecryptedJwt
            if (!decoded || !decoded.userId) {
                logger.warn(`Socket connection rejected — invalid token structure (id: ${socket.id})`)
                return next(new Error('Authentication error: Invalid token'))
            }

            const user = await userRepository.findUserById(decoded.userId)
            if (!user || (user.role !== EUserRoles.ADMIN && user.role !== EUserRoles.STAFF)) {
                logger.warn(`Socket connection rejected — unauthorized role (id: ${socket.id}, role: ${user?.role})`)
                return next(new Error('Authentication error: Unauthorized'))
            }

            socket.data.user = user
            logger.info(`Socket authenticated: ${user.name} (${user.role}, id: ${socket.id})`)
            next()
        } catch (error) {
            logger.error('Socket authentication error:', { meta: error })
            next(new Error('Authentication error'))
        }
    })

    io.on('connection', (socket) => {
        logger.info(`Socket connected: ${socket.id} — ${socket.data.user?.name} (${socket.data.user?.role})`)

        socket.on('disconnect', (reason) => {
            logger.info(`Socket disconnected: ${socket.id} — reason: ${reason}`)
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

/**
 * Emits the order:new event to all connected authenticated clients.
 * Called ONLY after the order is successfully persisted to the database.
 */
export const emitNewOrder = (order: any) => {
    try {
        const ioInstance = getIo()
        const connectedClients = ioInstance.engine.clientsCount
        logger.info(`[order:new] Emitting for Order #${order.orderNumber} to ${connectedClients} connected client(s)`)
        ioInstance.emit('order:new', order)
    } catch (error) {
        // Non-fatal: order is already in the DB; the kitchen will get it via REST polling
        logger.error('Failed to emit order:new:', { meta: error })
    }
}
