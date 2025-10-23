import { Prisma } from '@prisma/client'

// Novo errorHandler para Fastify: (error, request, reply)
export function errorHandler(error, request, reply) {
	// console.log(error)

	let message = error.message ?? 'Erro ao executar a operação.'


	if (hasZodFastifySchemaValidationErrors(error)) {
		// Processar os erros de validação manualmente
		const validationErrors = error.validation.map(err => ({
			field: err.instancePath.replace('/', ''),
			message: err.message,
			keyword: err.keyword
		}))

		const responseData = {
			error: 'Erro de Validação',
			message: "Os dados da requisição não correspondem ao schema esperado",
			statusCode: 400,
			details: {
				totalErrors: validationErrors.length,
				errors: validationErrors,
				method: request.method,
				url: request.url
			}
		}

		if (reply.sent) {
			return
		}

		return reply.code(400).send(responseData)
	}

	if (error.statusCode === 400 && error.code === 'FST_ERR_VALIDATION') {
		return reply.code(400).send({
			error: 'Erro de Validação',
			message: "Dados inválidos no body da requisição",
			statusCode: 400,
			details: {
				validation: error.validation,
				method: request.method,
				url: request.url
			}
		})
	}

	if (isResponseSerializationError(error)) {
		return reply.code(500).send({
			error: 'Erro Interno do Servidor',
			message: "A resposta não corresponde ao schema esperado",
			statusCode: 500,
			details: {
				issues: error.cause.issues,
				method: error.method,
				url: error.url
			}
		})
	}


	// if (error.statusCode === 400 && error.code === 'FST_ERR_VALIDATION' && error.validation) {
	// 	const validationErrors = error.validation.map(validationError => {
	// 		const field = validationError.instancePath.replace('/', '') || 'campo'

	// 		// Tratamentos específicos para diferentes tipos de erro Zod
	// 		switch (validationError.keyword) {
	// 			case 'invalid_type': {
	// 				const expectedType = validationError.params?.issue?.expected || 'tipo correto'
	// 				const receivedType = validationError.params?.issue?.received || 'tipo incorreto'

	// 				if (expectedType === 'date' && receivedType === 'string') {
	// 					return `O campo '${field}' deve ser uma data válida. Exemplo: "2025-08-22T10:30:00Z"`
	// 				}
	// 				return `O campo '${field}' deve ser do tipo ${expectedType}, mas foi recebido ${receivedType}`
	// 			}

	// 			case 'required':
	// 				return `O campo '${field}' é obrigatório`

	// 			case 'invalid_string':
	// 				return `O campo '${field}' contém um valor inválido`

	// 			case 'too_small': {
	// 				const min = validationError.params?.minimum || validationError.params?.min || 'mínimo'
	// 				return `O campo '${field}' deve ter pelo menos ${min} caracteres`
	// 			}

	// 			case 'too_big': {
	// 				const max = validationError.params?.maximum || validationError.params?.max || 'máximo'
	// 				return `O campo '${field}' deve ter no máximo ${max} caracteres`
	// 			}

	// 			case 'invalid_enum_value': {
	// 				const options = validationError.params?.options?.join(', ') || 'valores válidos'
	// 				return `O campo '${field}' deve ser um dos seguintes valores: ${options}`
	// 			}

	// 			default:
	// 				return `Erro de validação no campo '${field}': ${validationError.message}`
	// 		}
	// 	})

	// 	return reply
	// 		.status(400)
	// 		.send({
	// 			message: 'Erro de validação nos dados enviados.',
	// 			errors: validationErrors,
	// 			field_errors: error.validation
	// 		})
	// }

	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		const meta = error.meta
		switch (error.code) {
			case 'P1012':
				message = `Erro de esquema Prisma: ${meta.full_error}.`
				break
			case 'P1013':
				message = `A string de conexão do banco de dados é inválida. Detalhes: ${meta.details}.`
				break
			case 'P1014':
				message = `O ${meta.kind} subjacente para o modelo ${meta.model} não existe.`
				break
			case 'NEGAR_ASSINATURA':
				message = 'O autor já assinou a matéria, impossível negar a assinatura.'
				break
			case 'P1015':
				message = `O esquema Prisma está usando funcionalidades não suportadas na versão do banco de dados ${meta.database_version}. Erros: ${meta.errors}.`
				break
			case 'P1016':
				message = `A consulta bruta teve um número incorreto de parâmetros. Esperado: ${meta.expected}, atual: ${meta.actual}.`
				break
			case 'P1017':
				message = 'O servidor fechou a conexão.'
				break
			case 'P2000':
				message = `O valor fornecido é muito longo para o tipo da coluna ${meta.column_name}.`
				break
			case 'P2001':
				message = `O registro procurado na condição where (${meta.model_name}.${meta.argument_name} = ${meta.argument_value}) não existe.`
				break
			case 'P2002':
				message = `Falha na restrição única em ${meta.constraint}.`
				break
			case 'P2003':
				message = `Falha de restrição de chave estrangeira no campo: ${meta.field_name}.`
				break
			case 'P2004':
				message = `Uma restrição falhou no banco de dados: ${meta.database_error}.`
				break
			case 'P2005':
				message = `O valor ${meta.field_value} armazenado no banco de dados para o campo ${meta.field_name} é inválido para o tipo do campo.`
				break
			case 'P2006':
				message = `O valor fornecido ${meta.field_value} para o campo ${meta.field_name} no modelo ${meta.model_name} é inválido.`
				break
			case 'P2007':
				message = `Erro de validação de dados: ${meta.database_error}.`
				break
			case 'P2008':
				message = `Falha ao analisar a consulta ${meta.query_parsing_error} na posição ${meta.query_position}.`
				break
			case 'P2009':
				message = `Falha ao validar a consulta: ${meta.query_validation_error} na posição ${meta.query_position}.`
				break
			case 'P2010':
				message = `Consulta bruta falhou. Código: ${meta.code}. Mensagem: ${meta.message}.`
				break
			case 'P2011':
				message = `Violação de restrição de valor nulo na ${meta.constraint}.`
				break
			case 'P2012':
				message = `Falta um valor necessário em ${meta.path}.`
				break
			case 'P2013':
				message = `Falta o argumento necessário ${meta.argument_name} para o campo ${meta.field_name} em ${meta.object_name}.`
				break
			case 'P2014':
				message = `A alteração que você está tentando fazer violaria a relação necessária ${meta.relation_name} entre os modelos ${meta.model_a_name} e ${meta.model_b_name}.`
				break
			case 'P2017':
				message = `O registro para relação (${meta.relation_name}) entre os modelos ${meta.parent_name} e ${meta.child_name} não está conectado.`
				break
			case 'P2025':
				message =
					'Uma operação falhou porque depende de um ou mais registros que eram necessários, mas não foram encontrados.'
				break
			case 'P2026':
				message =
					'O atual provedor de banco de dados não suporta uma ou mais funcionalidades.'
				break
			case 'P2027':
				message = 'Múltiplos erros no banco de dados durante a operação.'
				break
			default:
				message = 'Erro não registrado.'
		}
	} else if (error instanceof TypeError) {
		const isUndefinedOrNull = /undefined|null/.test(error.message)
		message = isUndefinedOrNull
			? 'Possivelmente, um valor necessário não está definido ou é `null`. Verifique as variáveis e valores envolvidos na operação.'
			: 'Erro de tipo. Verifique os tipos de dados e valores envolvidos na operação.'
	} else {
		switch (error.code) {
			case 'NEGAR_ASSINATURA_MATERIA':
				message = 'O autor já assinou a matéria, impossível negar a assinatura.'
				break
			case 'VEREADOR_AUSENTE_MOMENTO':
				message = 'Nenhum vereador presente na sessão.'
				break
			case 'USUARIO_NAO_LOCALIZADO':
				message = 'Usuário não localizado ou senha inválida.'
				break
		}
	}

	console.log(error)


	return reply.status(500).send({
		message: message
	})
}
