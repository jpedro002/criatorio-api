import { sessionRoutes } from './_session.route.js'
import { usuarioRoutes } from './_usuario.route.js'

export function segurancaRoutes(fastify) {
	fastify.register(usuarioRoutes, { prefix: '/usuarios' })
	fastify.register(sessionRoutes, { prefix: '/auth' })
}
