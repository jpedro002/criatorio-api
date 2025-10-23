import fs from 'fs'
import path from 'path'
import { Prisma, PrismaClient } from '@prisma/client'
import { useUtils } from 'src/helpers'

const { parseValues, adjustTimezone } = useUtils()
let prisma

if (process.env.NODE_ENV === 'production') {
	prisma = new PrismaClient()
} else {
	if (!global.prisma) global.prisma = new PrismaClient()
	prisma = global.prisma
}

// middleware
prisma.$use(async (params, next) => {
	const { model, args } = params
	if (model && (args.where || args.data || args.create || args.update)) {
		const { fields, allModels } = prisma[model].getDatabase()
		const { where, data, create, update } = args
		if (where && Object.keys(where).length)
			params.args.where = parseValues(fields, where, allModels)
		if (data && Object.keys(data).length)
			params.args.data = parseValues(fields, data, allModels)
		if (create && Object.keys(create).length)
			params.args.create = parseValues(fields, create, allModels)
		if (update && Object.keys(update).length)
			params.args.update = parseValues(fields, update, allModels)
	}
	const result = await next(params)
	return result
})

prisma = prisma.$extends({
	model: {
		$allModels: {
			getDatabase() {
				const context = Prisma.getExtensionContext(this)
				const allModels = context.$parent._runtimeDataModel.models
				const { dbName, ...rest } = allModels[context.$name]
				return { name: dbName, allModels, ...rest }
			},
			async truncate() {
				const context = Prisma.getExtensionContext(this)
				const database = context.getDatabase()
				const query = `TRUNCATE TABLE ${database.name}`
				await prisma.$executeRaw(Prisma.raw(query))
				return 0
			},
			async createWithFile(file, { data: body, folder = null }) {
				const context = Prisma.getExtensionContext(this)
				const folderName = folder || context.$name
				const folderPath = path.join(__dirname, '..', 'public', folderName)
				if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath)
				fs.rename(file.path, path.join(folderPath, file.filename), err => {
					if (err) throw new Error('Erro ao mover o arquivo.')
				})
				const data = await context.create({ data: body })
				return data
			}
		}
	},
	query: {
		$allModels: {
			async $allOperations({ args, model, query }) {
				const { fields } = prisma[model].getDatabase()
				const result = await query(args)
				adjustTimezone(result, fields)
				return result
			}
		}
	}
})

export { prisma }
export default prisma
