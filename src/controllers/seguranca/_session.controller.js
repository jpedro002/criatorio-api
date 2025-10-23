import bcrypt from 'bcrypt'
import { prisma } from 'src/services'

export const sessionController = () => {
	/**
	 * @param {import('fastify').FastifyRequest} request
	 * @param {import('fastify').FastifyReply} reply
	 */
	const _login = async (request, reply) => {
		const { email, password } = request.body

		try {
			const usuario = await prisma.User.findFirst({
				where: {
					OR: [
						{ email: email.toLowerCase() },
						{ login: email.toLowerCase() }
					],
					active: true
				},
				select: {
					email: true,
					active: true,
					id: true,
					password_hash: true
				}
			})

			if (!usuario) {
				throw new Error('Usuário ou senha inválidos')
			}

			if (!usuario.active) {
				throw new Error('Usuário inativo')
			}

			const isPasswordValid = await bcrypt.compare(
				password,
				usuario.password_hash
			)

			if (!isPasswordValid) {
				throw new Error('Usuário ou senha inválidos')
			}

			const token = request.server.generateToken({
				id: usuario.id,
				fiscalId: usuario.fiscal?.id
			})

			return reply.send({
				token
			})
		} catch (error) {
			if (error instanceof Error) {
				return reply.code(400).send({
					error: 'Unauthorized',
					message: error.message
				})
			}
			throw error
		}
	}

	/**
	 * @param {import('fastify').FastifyRequest & { user?: {id: number} }} request
	 * @param {import('fastify').FastifyReply} reply
	 */
	const getSession = async (request, reply) => {
		try {
			const userId = request.user?.id

			if (!userId) {
				throw new Error('Token inválido')
			}

			const usuario = await prisma.User.findUnique({
				where: {
					id: userId,
					active: true
				},
				omit: {
					password_hash: true
				}
			})

			if (!usuario) {
				throw new Error('Usuário não encontrado ou inativo')
			}



			return reply.send({
				usuario
			})
		} catch (error) {
			if (error instanceof Error) {
				return reply.code(401).send({
					error: 'Unauthorized',
					message: error.message
				})
			}
			throw error
		}
	}

	return {
		login: _login,
		getSession
	}
}
