
import { format } from 'date-fns'

const CONDITIONS_AND_OPERATORS = [
	'AND',
	'OR',
	'NOT',
	'equals',
	'not',
	'in',
	'notIn',
	'lt',
	'lte',
	'gt',
	'gte',
	'contains',
	'search',
	'mode',
	'startsWith',
	'endsWith',
	'some',
	'every',
	'none',
	'is',
	'isNot',
]

const useUtils = () => {
	function createRouteGroup(server, prefix, routes) {

		// biome-ignore lint/complexity/noForEach: <explanation>
		routes.forEach(({ method, path, handler, options }) => {
			server.route({
				method,
				url: `${prefix}${path}`,
				handler,
				...(options || {}),
			})
		})
	}
	function convertMetadado(value, type) {
		if (!value || value === 'Não informado') return value
		if (type === 'date') return format(new Date(value), 'dd/MM/yyyy')
		if (type === 'checkbox') return value === 'true' ? 'Sim' : 'Não'
		return value
	}
	function isNumeric(value) {
		return /^-?\d+$/.test(value)
	}
	function isDateTimeString(input) {
		const dateTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/
		return dateTimePattern.test(input)
	}
	function validationParse(body, ignore = []) {
		for (const key in body) {
			if (typeof body[key] !== 'string') continue
			if (key === 'senha') continue
			if (ignore.includes(key)) continue
			if (isNumeric(body[key])) {
				body[key] = Number(body[key])
			} else if (isDateTimeString(body[key])) {
				body[key] = new Date(body[key].concat('Z'))
			}
		}
		return body
	}
	function ajustarFusoHorario(dataString, horasParaRemover = 3) {
		const data = new Date(dataString)
		data.setHours(data.getHours() - horasParaRemover)
		return data.toISOString()
	}
	function capitalizeFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1)
	}
	function parseArray(type, array) {
		if (Array.isArray(type) || !Array.isArray(array)) return array
		switch (type) {
			case 'Int':
				return array.map(Number)
			case 'DateTime':
				return array.map((a) => new Date(a))
			case 'Boolean':
				return array.map((m) => (m === 'true'))
		}
	}
	function parseObject(type, json, fields) {
		if (Array.isArray(type)) return json
		if (json === null) return json
		for (const [key, value] of Object.entries(json)) {
			if (Array.isArray(value)) {
				json[key] = parseArray(type, value)
				continue
			}
			if (CONDITIONS_AND_OPERATORS.includes(key)) {
				json[key] = parseValues(fields, value)
				continue
			}
			switch (type) {
				case 'DateTime':
					json[key] = new Date(value)
					break
				case 'Int':
					json[key] = Number(value)
					break
				case 'Boolean':
					json[key] = value === 'true'
					break
			}
		}
		return json
	}
	/**
	 * @param {{name: String, isId: Boolean, kind: String, type: String, default: { name: String }}[]} fields
	 */
	function parseValues(fields = {}, json = {}, models = {}) {
		if (json === null) return json
		for (const [key, value] of Object.entries(json)) {
			if (CONDITIONS_AND_OPERATORS.includes(key)) {
				json[key] = Array.isArray(value)
					? value.map((j) => parseValues(fields, j, models))
					: parseValues(fields, value, models)
				continue
			}
			const field = fields.find((f) => f.name === key)
			if (!field) {
				if (typeof value === 'object') json[key] = parseValues(fields, value, models)
				continue
			}
			if (field.kind === 'object' && field.relationName) {
				json[key] = parseValues(models[field.type].fields, value, models)
				continue
			}
			if (field.kind !== 'scalar') continue
			if (typeof value === 'object') json[key] = parseObject(field.type, value, fields)
			else if (typeof value === 'string')
				switch (field.type) {
					case 'DateTime':
						json[key] = new Date(value)
						break
					case 'Int':
						json[key] = Number(value)
						break
					case 'Boolean':
						json[key] = value === 'true'
						break
				}
			else if (field.type === 'String') json[key] = String(value)
		}
		return json
	}
	function adjustTimezone(obj, fields = null) {
		if (Array.isArray(obj)) {
			// biome-ignore lint/complexity/noForEach: <explanation>
			obj.forEach((item) => adjustTimezone(item, fields))
		} else if (obj && typeof obj === 'object') {
			// biome-ignore lint/complexity/noForEach: <explanation>
			Object.keys(obj).forEach((key) => {
				if (obj[key] instanceof Date) {
					if (fields) {
						const field = fields.find((f) => f.name === key)
						if (field?.nativeType && field.nativeType[0] === 'Date') return
					}
					obj[key] = new Date(obj[key].getTime() - 3 * 60 * 60 * 1000)
				} else if (obj[key] && (typeof obj[key] === 'object' || Array.isArray(obj[key]))) {
					adjustTimezone(obj[key], fields)
				}
			})
		}
	}
	function intervaloDoDiaBrasilia(dataStr) {
		// Parseia a data como se fosse meia-noite no horário de Brasília (UTC-3)
		const dataInicio = new Date(`${dataStr}T00:00:00-03:00`)
		const dataFim = new Date(`${dataStr}T23:59:59-03:00`)

		return {
			inicioUTC: new Date(dataInicio.getTime() - 3 * 60 * 60 * 1000),
			fimUTC: new Date(dataFim.getTime() - 3 * 60 * 60 * 1000),
		}
	}



	const mappingFields = (field, term, table) => {
		const checkFields = ['Int', 'Boolean', 'Date', 'DateTime']

		// Helper functions to reduce code duplication
		const createDateTimeFilter = (term) => {
			const { inicioUTC, fimUTC } = intervaloDoDiaBrasilia(term)
			return { gte: inicioUTC, lte: fimUTC }
		}

		const createInsensitiveSearch = (term) => ({ contains: term, mode: 'insensitive' })

		// Check field type efficiently (memoize field lookup)
		const getFieldType = (fieldName) => {
			const fieldInfo = table.fields.find(f => f.name === fieldName)
			return fieldInfo?.type
		}

		// Handle fields with dot notation (relation.field)
		if (field.includes('.')) {
			const [field1, field2] = field.split('.')

			// Handle relational list field with condition (list:check.field)
			if (field1.includes(':')) {
				const [fieldList, fieldCheck] = field1.split(':')
				const fieldType = table.fields[field2]?.type

				if (checkFields.includes(fieldType)) {
					return {
						[fieldList]: { some: { [fieldCheck]: { [field2]: fieldType === 'DateTime' ? createDateTimeFilter(term) : term } } }
					}
				}

				return {
					[fieldList]: {
						some: { [fieldCheck]: { [field2]: createInsensitiveSearch(term) } }
					}
				}
			}

			// Simple relation field
			return { [field1]: { [field2]: createInsensitiveSearch(term) } }
		}

		// Handle fields with colon notation (list:field)
		if (field.includes(':')) {
			const [fieldList, fieldCheck] = field.split(':')
			let fieldType = table.fields.find((f) => f.name === fieldList)

			// Performance optimization - avoid unnecessary lookups
			if (fieldType?.isList) {
				// biome-ignore lint/complexity/useLiteralKeys: <explanation>
				const processoDadoFields = table.allModels['processoDado'].fields
				const checkField = processoDadoFields.find(f => f.name === fieldCheck)
				fieldType = checkField?.type
			}

			if (checkFields.includes(fieldType)) {
				return {
					[fieldList]: { some: { [fieldCheck]: fieldType === 'DateTime' ? createDateTimeFilter(term) : term } }
				}
			}

			return {
				[fieldList]: {
					some: { [fieldCheck]: createInsensitiveSearch(term) }
				}
			}
		}

		// Handle simple fields
		const fieldType = getFieldType(field)
		if (checkFields.includes(fieldType)) {
			return { [field]: fieldType === 'DateTime' ? createDateTimeFilter(term) : term }
		}

		return { [field]: createInsensitiveSearch(term) }
	}

	const mapOrder = (order) => {
		if (!order) return null

		if (Array.isArray(order)) {
			return order.map(({ field, direction }) => {

				if (!field) return null
				if (!direction) direction = 'asc'


				return ({ [field]: direction })
			})
		}



	}


	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

	return {
		createRouteGroup,
		validationParse,
		parseValues,
		mappingFields,
		convertMetadado,
		capitalizeFirstLetter,
		ajustarFusoHorario,
		adjustTimezone,
		mapOrder,
		delay,
	}
}

export { useUtils }
export default useUtils
