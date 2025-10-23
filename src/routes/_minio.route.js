import { z } from 'zod'
import { listObjects } from '../controllers'

export default function minioRoutes(fastify) {
	// GET /minio/objects - Lista todos os objetos do bucket
	fastify.get(
		'/objects',
		{
			schema: {
				description: 'Lista todos os objetos do bucket MinIO',
				tags: ['MinIO'],
				querystring: z.object({
					prefix: z
						.string()
						.optional()
						.describe('Prefixo para filtrar objetos (opcional)'),
					recursive: z
						.enum(['true', 'false'])
						.optional()
						.describe('Busca recursiva (padrão: true)')
				})
			}
		},
		listObjects
	)
}
