import cors from '@fastify/cors'
import dotenv from 'dotenv'
import fp from 'fastify-plugin'
import { settings } from 'src/config'

dotenv.config()

export default fp(async fastify => {
	console.log('CORS_ORIGIN:', settings.CORS_ORIGIN)

	const allowedOrigins = settings.CORS_ORIGIN
		? settings.CORS_ORIGIN.split(',')
		: []

	fastify.register(cors, {
		origin: (origin, cb) => {
			console.log('Received Origin:', origin)

			if (!origin) {
				cb(null, true)
				return
			}

			const isAllowed = allowedOrigins.some(allowedOrigin =>
				origin.includes(allowedOrigin.trim())
			)

			if (isAllowed) {
				cb(null, true)
			} else {
				cb(new Error('Not allowed by CORS'), false)
			}
		},
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true
	})
})
