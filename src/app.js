import Fastify from 'fastify'
import fastifyQs from 'fastify-qs'
import {
	serializerCompiler,
	validatorCompiler
} from 'fastify-type-provider-zod'
import corsPlugin from 'src/plugins/_cors'
import swaggerPlugin from 'src/plugins/_swagger'
import { z } from 'zod'
import { errorHandler, useUtils } from './helpers'
import { jwtPlugin } from './plugins'
import { minioRoutes, segurancaRoutes } from './routes'

export async function createApp() {
	// biome-ignore lint/correctness/noUnusedVariables: <>
	const { delay } = useUtils()

	const server = Fastify({ logger: true })

	server.setValidatorCompiler(validatorCompiler)
	server.setSerializerCompiler(serializerCompiler)

	await server.register(corsPlugin)
	await server.register(swaggerPlugin)
	await server.register(jwtPlugin)
	await server.register(fastifyQs)

	const HomeSchema = {
		tags: ['API Info'],
		summary: 'Informações da API',
		description: 'Retorna informações básicas sobre a API Fiscalize do AGEFIS',
		response: {
			200: z.object({
				msg: z.string().describe('Mensagem de boas-vindas da API')
			})
		}
	}

	server.get('/', { schema: HomeSchema }, function handler(_request, _reply) {
		return { msg: 'Fiscalize API - AGEFIS' }
	})

	// Registrar rotas de segurança
	server.register(segurancaRoutes, { prefix: '/api/seguranca' })

	// Registrar rotas do MinIO
	server.register(minioRoutes, { prefix: '/api/minio' })

	// if (settings.NODE_ENV === 'development') {
	// 	server.addHook('onRequest', async () => {
	// 		await delay(3000)
	// 	})
	// }

	// Registrar o errorHandler nativo do Fastify
	server.setErrorHandler(errorHandler)


	return server
}
