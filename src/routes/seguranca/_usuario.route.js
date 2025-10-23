import { usuarioController } from 'src/controllers/seguranca'
import { baseRouter } from 'src/routes'
import { z } from 'zod'

const UsuarioCreateSchema = z.object({
	login: z
		.string()
		.min(1, 'Login é obrigatório')
		.max(90, 'Login deve ter no máximo 90 caracteres'),
	email: z
		.email('Email inválido')
		.max(200, 'Email deve ter no máximo 200 caracteres'),
	password_hash: z
		.string()
		.min(1, 'Hash da senha é obrigatório'),
	name: z
		.string()
		.min(1, 'Nome é obrigatório')
		.max(90, 'Nome deve ter no máximo 90 caracteres'),
	role: z.enum(['ADMIN'], 'Role é obrigatório'),
	active: z.boolean().optional().default(true)
})

const UsuarioUpdateSchema = z.object({
	login: z
		.string()
		.min(1, 'Login é obrigatório')
		.max(90, 'Login deve ter no máximo 90 caracteres')
		.optional(),
	email: z
		.string()
		.email('Email inválido')
		.max(200, 'Email deve ter no máximo 200 caracteres')
		.optional(),
	name: z
		.string()
		.min(1, 'Nome é obrigatório')
		.max(90, 'Nome deve ter no máximo 90 caracteres')
		.optional(),
	role: z.enum(['ADMIN']).optional(),
	active: z.boolean().optional()
})



export function usuarioRoutes(fastify) {
	const controller = usuarioController()

	const middleware = [fastify.authenticate]

	baseRouter(fastify, controller, {
		tag: 'segurança - Usuários',
		summary: 'Gerenciamento de Usuários',
		entityName: 'usuário',
		middleware: middleware,
		schemas: {
			createSchema: UsuarioCreateSchema,
			updateSchema: UsuarioUpdateSchema,
			entitySchema: z.any()
		}
	})

	// Rota para atualização de senha
	fastify.route({
		method: 'POST',
		url: '/update-password',
		preHandler: middleware,
		schema: {
			tags: ['segurança - Usuários'],
			summary: 'Atualizar senha do usuário',
			description:
				'Permite ao usuário trocar sua senha informando a senha antiga e a nova senha.',
			body: z.object({
				oldPassword: z.string().min(1, 'Senha antiga obrigatória'),
				newPassword: z
					.string()
					.min(6, 'Nova senha deve ter ao menos 6 caracteres')
			}),
			response: {
				200: z.object({ success: z.boolean() }),
				400: z.object({ error: z.string() }),
				401: z.object({ error: z.string() }),
				404: z.object({ error: z.string() })
			}
		},
		handler: controller.updatePassword
	})
}
