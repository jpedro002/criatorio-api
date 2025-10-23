import { api } from './_axios'

const baseUrl = '/integra'

/**
 * Importa uma demanda de API externa
 */
const importarDemandaExterna = async data => {
	const response = await api.post(`${baseUrl}/importar-externa`, data)
	return response.data
}

/**
 * Cancela uma demanda
 */
const cancelarDemanda = async data => {
	const response = await api.post(`${baseUrl}/cancelar-demanda`, data)
	return response.data
}

/**
 * Obtém metadados para auto de infração
 */
const obterMetadadosAutoInfracao = async demanda_id => {
	const response = await api.post(`${baseUrl}/auto-infracao/${demanda_id}`)
	return response.data
}

/**
 * Marca demanda como concluída
 */
const concluirDemanda = async data => {
	const response = await api.post(`${baseUrl}/concluir-demanda`, data)
	return response.data
}

/**
 * Importa múltiplas demandas em lote
 */
const importarDemandasLote = async demandas => {
	const resultados = []

	for (const demanda of demandas) {
		try {
			const resultado = await importarDemandaExterna(demanda)
			resultados.push({
				success: true,
				data: resultado,
				demanda_original: demanda
			})

			// Pequeno delay entre requisições
			await new Promise(resolve => setTimeout(resolve, 100))
		} catch (error) {
			resultados.push({
				success: false,
				error: error.message,
				demanda_original: demanda
			})
		}
	}

	return resultados
}

export const integraFiscalizeService = {
	importarDemandaExterna,
	cancelarDemanda,
	obterMetadadosAutoInfracao,
	concluirDemanda,
	importarDemandasLote
}
