import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import fp from 'fastify-plugin'
import {
	jsonSchemaTransform,
	jsonSchemaTransformObject
} from 'fastify-type-provider-zod'

export default fp(async fastify => {
	// Registrar Swagger
	await fastify.register(swagger, {
		openapi: {
			info: {
				title: 'API Documentation',
				description: 'API description for ',
				version: '1.0.0',
				contact: {
					name: 'Equipe de Desenvolvimento',
					email: 'joaopsilvavolei@gmail.com'
				}
			},
			servers: [
				{
					url: 'http://localhost:3000',
					description: 'Servidor de desenvolvimento'
				}
			],
			security: [
				{
					BearerAuth: []
				}
			],
			components: {
				securitySchemes: {
					BearerAuth: {
						type: 'http',
						scheme: 'bearer',
						bearerFormat: 'JWT',
						description: 'Token JWT para autenticação. Formato: Bearer <token>'
					}
				}
			}
		},
		transform: jsonSchemaTransform,
		jsonSchemaTransform: jsonSchemaTransformObject
	})

	// Registrar Swagger UI
	await fastify.register(swaggerUi, {
		routePrefix: '/docs',
		uiConfig: {
			docExpansion: 'list',
			deepLinking: true,
			defaultModelsExpandDepth: 2,
			defaultModelExpandDepth: 2,
			tagsSorter: 'alpha',
			operationsSorter: 'method',
			filter: true,
			tryItOutEnabled: true,
			supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
			persistAuthorization: true
		},
		staticCSP: true,
		transformSpecificationClone: true
	})

	fastify.log.info('Plugin Swagger registrado com sucesso')
})
