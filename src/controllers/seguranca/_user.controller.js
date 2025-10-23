import bcrypt from 'bcrypt'
import { baseController } from 'src/controllers'
import { prisma } from 'src/services'

function usuarioController() {
	const select = null
	const SALT_ROUNDS = 10

	const base = baseController('User', { select })

	const post = async (request, reply) => {
		const { body } = request
		const { password_hash: pwd, email, ...rest } = body


		const hashedPassword = await bcrypt.hash(pwd, SALT_ROUNDS)

		const usuarioData = {
			...rest,
			email: email.toLowerCase().trim(),
			password_hash: hashedPassword
		}

		const data = await prisma.usuarios.create({
			data: { ...usuarioData }
		})
		reply.code(201).send(data)
	}

	const updatePassword = async (request, reply) => {
		const { id } = request.user
		const { oldPassword, newPassword } = request.body
		if (!oldPassword || !newPassword) {
			return reply
				.code(400)
				.send({ error: 'oldPassword e newPassword são obrigatórios' })
		}
		const usuario = await prisma.usuarios.findUnique({
			where: { id },
			select: { password_hash: true }
		})
		if (!usuario) {
			return reply.code(404).send({ error: 'Usuário não encontrado' })
		}
		const match = await bcrypt.compare(oldPassword, usuario.password_hash)
		if (!match) {
			return reply.code(401).send({ error: 'Senha antiga incorreta' })
		}

		const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)
		await prisma.usuarios.update({
			where: { id },
			data: { password_hash: hashedPassword }
		})
		reply.code(200).send({ success: true })
	}

	return {
		...base,
		post,
		updatePassword
	}
}

export { usuarioController }
