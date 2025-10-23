import { z } from 'zod'

/**
 * Base router para registrar automaticamente as 6 rotas padrão de um controller
 * @param {import('fastify').FastifyInstance} fastify - Instância do Fastify
 * @param {object} controller - Controller com os métodos base (all, fetch, one, post, put, del)
 * @param {object} options - Opções do router
 * @param {string} options.tag - Tag para agrupar as rotas na documentação Swagger
 * @param {string} [options.summary] - Resumo opcional das rotas
 * @param {object} [options.schemas] - Schemas Zod para validação (createSchema, updateSchema, entitySchema)
 * @param {object} [options.middleware] - Middleware personalizado para aplicar nas rotas
 * @param {string} [options.entityName] - Nome da entidade (usado para gerar descrições)
 */
function baseRouter(fastify, controller, options = {}) {
	const {
		tag,
		summary = '',
		schemas = {},
		middleware = [],
		entityName = tag?.toLowerCase() || 'item'
	} = options

	const { createSchema, updateSchema, entitySchema } = schemas

	const { all, fetch, one, post, put, del } = controller

	const defaultMiddleware = middleware.length > 0 ? middleware : []

	const errorSchema = z.object({
		error: z.string().optional(),
		message: z.string(),
		statusCode: z.number().optional(),
		details: z.any().optional(),
		errors: z.any().optional()
	})

	const paginationSchema = z.object({
		page: z.number(),
		rowCount: z.number(),
		pageCount: z.number()
	})

	const queryParamsSchema = z.object({
		term: z.string().optional(),
		fields: z
			.union([z.array(z.string()), z.string(), z.undefined()])
			.optional()
			.transform(val => {
				if (Array.isArray(val)) {
					return val
				}
				if (typeof val === 'string') {
					return [val]
				}
				return []
			}),
		order: z.string().optional(),
		orderDirection: z.enum(['asc', 'desc']).default('asc').optional(),
		fspecifics: z.string().optional()
	})

	const fetchQueryParamsSchema = queryParamsSchema.extend({
		page: z.coerce.number().positive().optional().default(1),
		pageSize: z.coerce.number().positive().optional().default(20)
	})

	const idParamsSchema = z.object({
		id: z.string().transform(val => Number.parseInt(val, 10))
	})

	// Rota POST - Criar novo registro
	fastify.post('/', {
		preValidation: defaultMiddleware,
		handler: post,
		schema: {
			tags: [tag],
			summary: summary ? `${summary} - Criar` : `Criar novo ${entityName}`,
			description: `Cria um novo ${entityName}`,
			...(createSchema && { body: createSchema }),
			response: {
				201: entitySchema || z.any(),
				400: errorSchema
			}
		}
	})

	// Rota PUT - Atualizar registro existente
	fastify.put('/:id', {
		preValidation: defaultMiddleware,
		handler: put,
		schema: {
			tags: [tag],
			summary: summary
				? `${summary} - Atualizar`
				: `Atualizar ${entityName} existente`,
			description: `Atualiza um ${entityName} existente`,
			params: idParamsSchema,
			...(updateSchema && { body: updateSchema }),
			response: {
				200: entitySchema || z.any(),
				400: errorSchema,
				404: errorSchema
			}
		}
	})

	// Rota GET - Listar todos os registros
	fastify.get('/all', {
		preValidation: defaultMiddleware,
		handler: all,
		schema: {
			tags: [tag],
			summary: summary
				? `${summary} - Listar`
				: `Listar todos os ${entityName}s`,
			description: `Lista todos os ${entityName}s com opções de filtro`,
			querystring: queryParamsSchema,
			response: {
				200: z.object({
					data: z.array(entitySchema || z.any()),
					rowCount: z.number()
				})
			}
		}
	})

	// Rota GET / - Busca paginada
	fastify.get('/', {
		preValidation: defaultMiddleware,
		handler: fetch,
		schema: {
			tags: [tag],
			summary: summary
				? `${summary} - Buscar`
				: `Buscar ${entityName}s com paginação`,
			description: `Busca ${entityName}s com paginação e filtros`,
			querystring: fetchQueryParamsSchema,
			response: {
				200: z.object({
					data: z.array(entitySchema || z.any()),
					pagination: paginationSchema
				})
			}
		}
	})

	// Rota GET /:id - Obter um registro por ID
	fastify.get('/:id', {
		preValidation: defaultMiddleware,
		handler: one,
		schema: {
			tags: [tag],
			summary: summary ? `${summary} - Obter` : `Obter ${entityName} por ID`,
			description: `Obtém um ${entityName} específico pelo ID`,
			params: idParamsSchema,
			response: {
				200: entitySchema || z.any(),
				404: errorSchema
			}
		}
	})

	// Rota DELETE /:id - Excluir registro por ID
	fastify.delete('/:id', {
		preValidation: defaultMiddleware,
		handler: del,
		schema: {
			tags: [tag],
			summary: summary
				? `${summary} - Excluir`
				: `Excluir ${entityName} por ID`,
			description: `Exclui um ${entityName} específico pelo ID`,
			params: idParamsSchema,
			response: {
				204: z.null(),
				404: errorSchema
			}
		}
	})
}

export { baseRouter }
export default baseRouter
