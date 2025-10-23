import { useUtils } from 'src/helpers'

function baseService(model) {
	async function readAll(params = {}, tr) {
		const {
			fields = null,
			term = null,
			order = null,
			select = null,
			include = null
		} = params

		// construcao do predicado
		let predicate = { where: {} }
		if (term && fields && Array.isArray(fields))
			predicate = {
				where: {
					OR: fields.map(m => {
						if (m.includes('.')) {
							const [field1, field2] = m.split('.')
							return {
								[field1]: { [field2]: { contains: term, mode: 'insensitive' } }
							}
						}
						return { [m]: { contains: term, mode: 'insensitive' } }
					})
				}
			}

		const [rowCount, data] = await Promise.all([
			tr[model].count({ ...predicate }),
			tr[model].findMany({
				...predicate,
				orderBy: order ? { order: 'asc' } : {},
				select: select,
				include: include
			})
		])
		return { data, rowCount }
	}
	async function readPage(params = {}, tr) {
		const {
			fields = [],
			term = null,
			order = null,
			page = 1,
			pageSize = 20,
			select = null,
			include = null,
			fspecifics = []
		} = params

		const { mappingFields } = useUtils()

		let predicate = { where: {} }
		const table = tr[model].getDatabase()
		if (term && fields && Array.isArray(fields))
			predicate = {
				where: {
					OR: fields.map(m => mappingFields(m, term, table))
				}
			}
		if (fspecifics && Array.isArray(fspecifics))
			predicate.where = {
				...predicate.where,
				AND: fspecifics
					.filter(m => m)
					.map(m => m.split('$'))
					.map(([field, value]) => mappingFields(field, value, table))
			}

		const [rowCount, data] = await Promise.all([
			tr[model].count({ ...predicate }),
			tr[model].findMany({
				...predicate,
				take: Number(pageSize),
				skip: (Number(page) - 1) * Number(pageSize),
				orderBy: order ? { [order]: 'asc' } : {},
				select: select,
				include: include
			})
		])
		return {
			data: data,
			pagination: {
				page: Number(page),
				rowCount: rowCount,
				pageCount: Math.ceil(rowCount / pageSize) || 1
			}
		}
	}
	async function read(id, params = {}, tr) {
		const { select = null, include = null } = params
		const data = await tr[model].findUnique({
			where: { id: Number(id) },
			select: select,
			include: include
		})
		if (!data) throw new Error('Registro não localizado.')
		return data
	}
	async function create(body, tr) {
		const data = await tr[model].create({
			data: { ...body }
		})
		return data
	}
	async function update(id, body = {}, tr) {
		const data = await tr[model].update({
			data: { ...body },
			where: { id: Number(id) }
		})
		return data
	}
	async function destroy(id, tr) {
		await tr[model].delete({
			where: { id: Number(id) }
		})
	}

	return {
		readAll,
		readPage,
		read,
		create,
		update,
		destroy
	}
}

export default baseService
export { baseService }
