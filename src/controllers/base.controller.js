import { useUtils } from 'src/helpers'
import { prisma } from 'src/services'

function baseController(model, params = {}) {
	const { select = null, include = null } = params
	const { mappingFields, mapOrder } = useUtils()

	/**
	 * @param {import('fastify').FastifyRequest} request
	 * @param {import('fastify').FastifyReply} reply
	 */
	async function all(request, reply) {
		const {
			fields = [],
			term = null,
			order = null,
			fspecifics = []
		} = request.query

		let predicate = { where: {} }
		const table = prisma[model].getDatabase()
		if (term && fields && Array.isArray(fields)) {
			predicate = {
				where: {
					OR: fields.map(m => mappingFields(m, term, table))
				}
			}
		}
		if (fspecifics && Array.isArray(fspecifics)) {
			predicate.where = {
				...predicate.where,
				AND: fspecifics
					.filter(m => m)
					.map(m => m.split('$'))
					.map(([field, value]) => mappingFields(field, value, table))
			}
		}

		const [rowCount, data] = await prisma.$transaction([
			prisma[model].count({ ...predicate }),
			prisma[model].findMany({
				...predicate,
				orderBy: order ? mapOrder(order) : {},
				select: select,
				include: include
			})
		])
		reply.send({ data, rowCount })
	}

	/**
	 * @param {import('fastify').FastifyRequest} request
	 * @param {import('fastify').FastifyReply} reply
	 */
	async function fetch(request, reply) {
		const {
			fields = [],
			term = null,
			order = null,
			orderDirection = 'asc',
			page = 1,
			pageSize = 20,
			fspecifics = []
		} = request.query
		let predicate = { where: {} }
		const table = prisma[model].getDatabase()
		if (term && fields && Array.isArray(fields)) {
			predicate = {
				where: {
					OR: fields.map(m => mappingFields(m, term, table))
				}
			}
		}
		if (fspecifics && Array.isArray(fspecifics)) {
			predicate.where = {
				...predicate.where,
				AND: fspecifics
					.filter(m => m)
					.map(m => m.split('$'))
					.map(([m, value]) => mappingFields(m, value, table))
			}
		}

		const [rowCount, data] = await prisma.$transaction([
			prisma[model].count({ ...predicate }),
			prisma[model].findMany({
				...predicate,
				take: Number(pageSize),
				skip: (Number(page) - 1) * Number(pageSize),
				orderBy: order ? mapOrder(order) : {},
				select: select,
				include: include
			})
		])
		reply.send({
			data,
			pagination: {
				page: Number(page),
				rowCount,
				pageCount: Math.ceil(rowCount / pageSize) || 1
			}
		})
	}

	/**
	 * @param {import('fastify').FastifyRequest} request
	 * @param {import('fastify').FastifyReply} reply
	 */
	async function one(request, reply) {
		const { id } = request.params
		const data = await prisma[model].findUnique({
			where: { id: id },
			select: select,
			include: include
		})
		if (!data) {
			throw new Error('Registro não localizado.')
		}
		reply.send(data)
	}

	/**
	 * @param {import('fastify').FastifyRequest} request
	 * @param {import('fastify').FastifyReply} reply
	 */
	async function post(request, reply) {
		const { id: _, ...body } = request.body
		const data = await prisma[model].create({
			data: { ...body },
			select: select,
			include: include
		})
		reply.code(201).send(data)
	}

	/**
	 * @param {import('fastify').FastifyRequest} request
	 * @param {import('fastify').FastifyReply} reply
	 */
	async function put(request, reply) {
		const { id } = request.params
		const { id: _, ...body } = request.body
		const data = await prisma[model].update({
			data: { ...body },
			where: { id: id },
			select: select,
			include: include
		})
		reply.send(data)
	}

	/**
	 * @param {import('fastify').FastifyRequest} request
	 * @param {import('fastify').FastifyReply} reply
	 */
	async function del(request, reply) {
		const { id } = request.params
		await prisma[model].delete({
			where: { id: id }
		})
		reply.code(204).send()
	}

	return {
		all,
		fetch,
		one,
		post,
		put,
		del
	}
}

export { baseController }
