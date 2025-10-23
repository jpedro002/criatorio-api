import { minioService } from '../services'

export const listObjects = async (request, reply) => {
	try {
		const { prefix, recursive } = request.query

		const objects = await minioService.listObjects(
			prefix || '',
			recursive !== undefined ? recursive === 'true' : true
		)

		return reply.status(200).send({
			success: true,
			data: {
				bucket: process.env.MINIO_BUCKET_NAME || 'default-bucket',
				objects,
				count: objects.length
			}
		})
	} catch (error) {
		console.error('❌ Erro ao listar objetos do bucket:', error)
		return reply.status(500).send({
			success: false,
			message: 'Erro interno do servidor ao listar objetos',
			error: error.message
		})
	}
}
