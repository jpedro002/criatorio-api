import { sessionController } from 'src/controllers/seguranca'
import { z } from 'zod'

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
export const sessionRoutes = fastify => {
	const controller = sessionController()

	const LoginSchema = {
		tags: ['Segurança - Autenticação'],
		summary: 'Realizar login no sistema',
		description: 'Autentica usuário e retorna token JWT',
		body: z.object({
			email: z
				.string()
				.describe('Email ou login do usuário'),
			password: z
				.string()
				.min(1, 'Senha é obrigatória')
				.describe('Senha do usuário')
		}),
		response: {
			200: z.object({
				token: z.string().describe('Token JWT para autenticação')
			}),
			401: z.object({
				error: z.string().describe('Tipo do erro'),
				message: z.string().describe('Mensagem de erro')
			})
		}
	}

	const GetSessionSchema = {
		tags: ['Segurança - Autenticação'],
		summary: 'Obter dados da sessão atual',
		description: 'Retorna dados completos do usuário autenticado',
		response: {
			200: z.object({
				usuario: z.object({
					id: z.string().describe('ID do usuário (UUID)'),
					email: z.email().describe('Email do usuário'),
					login: z.string().describe('Login do usuário'),
					name: z.string().describe('Nome completo do usuário'),
					role: z.string().describe('Role do usuário'),
					createdAt: z.date().describe('Data de criação (ISO 8601)'),
					active: z.boolean().describe('Status ativo do usuário')
				})
			}),
			401: z.object({
				error: z.string().describe('Tipo do erro'),
				message: z.string().describe('Mensagem de erro')
			})
		}
	}

	fastify.post('/session', { schema: LoginSchema }, controller.login)

	fastify.get(
		'/session',
		{
			schema: GetSessionSchema,
			preHandler: fastify.authenticate
		},
		controller.getSession
	)
}
