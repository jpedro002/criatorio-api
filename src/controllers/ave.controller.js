import { baseController } from './base.controller.js'
import { prisma } from '../services/index.js'

// CRUD padrão (all, fetch, one, post, put, del)
const aveBaseController = baseController('ave')

/**
 * Verificar se anilha é única
 * @param {string} anilha - Anilha a verificar
 * @param {string} excludeId - ID para excluir da verificação (update)
 */
const _isAnilhaUnique = async (anilha, excludeId = null) => {
    const existing = await prisma.ave.findUnique({
        where: { anilha }
    })

    if (!existing) return true
    if (excludeId && existing.id === excludeId) return true

    return false
}

/**
 * Verificar se há referência circular
 */
const _hasCircularReference = async (aveId, paiId, maeId) => {
    const checkAncestor = async (ancestorId, targetId, visited = new Set()) => {
        if (!ancestorId || ancestorId === targetId)
            return ancestorId === targetId
        if (visited.has(ancestorId)) return false

        visited.add(ancestorId)

        const ancestor = await prisma.ave.findUnique({
            where: { id: ancestorId },
            select: { paiId: true, maeId: true }
        })

        if (!ancestor) return false

        return (
            (await checkAncestor(ancestor.paiId, targetId, visited)) ||
            (await checkAncestor(ancestor.maeId, targetId, visited))
        )
    }

    if (paiId && (await checkAncestor(paiId, aveId))) return true
    if (maeId && (await checkAncestor(maeId, aveId))) return true

    return false
}

/**
 * Validar relacionamentos genealógicos antes de criar/atualizar
 * @param {string} aveId - ID da ave (null para criação)
 * @param {Object} data - Dados com paiId e maeId
 */
const _validateGenealogiaRelationship = async (aveId, data) => {
    const { paiId, maeId, sexo, nascimento } = data

    // Validar que ave não é pai/mãe de si mesma
    if (aveId && (paiId === aveId || maeId === aveId)) {
        throw new Error('Uma ave não pode ser pai/mãe de si mesma')
    }

    // Validar sexo do pai
    if (paiId) {
        const pai = await prisma.ave.findUnique({ where: { id: paiId } })
        if (!pai) {
            throw new Error('Pai não encontrado')
        }
        if (pai.sexo !== 'MACHO' && pai.sexo !== 'INDETERMINADO') {
            throw new Error('Pai deve ter sexo MACHO ou INDETERMINADO')
        }

        // Validar data de nascimento
        if (nascimento && new Date(nascimento) <= new Date(pai.nascimento)) {
            throw new Error('Data de nascimento deve ser posterior ao pai')
        }
    }

    // Validar sexo da mãe
    if (maeId) {
        const mae = await prisma.ave.findUnique({ where: { id: maeId } })
        if (!mae) {
            throw new Error('Mãe não encontrada')
        }
        if (mae.sexo !== 'FEMEA' && mae.sexo !== 'INDETERMINADO') {
            throw new Error('Mãe deve ter sexo FEMEA ou INDETERMINADO')
        }

        // Validar data de nascimento
        if (nascimento && new Date(nascimento) <= new Date(mae.nascimento)) {
            throw new Error('Data de nascimento deve ser posterior à mãe')
        }
    }

    // Validar referência circular (ave não pode ter descendente como ancestral)
    if (aveId && (paiId || maeId)) {
        const hasCircularRef = await _hasCircularReference(
            aveId,
            paiId,
            maeId
        )
        if (hasCircularRef) {
            throw new Error('Referência circular detectada na genealogia')
        }
    }
}

/**
 * Criar ave com validações
 */
const _createWithValidation = async (data, tr = prisma) => {
    // Validar anilha única
    const isUnique = await _isAnilhaUnique(data.anilha)
    if (!isUnique) {
        throw new Error('Anilha já cadastrada no sistema')
    }

    // Validar data não futura
    if (new Date(data.nascimento) > new Date()) {
        throw new Error('Data de nascimento não pode ser futura')
    }

    // Validar relacionamentos
    await _validateGenealogiaRelationship(null, data)

    // Criar ave
    return await tr.ave.create({ data })
}

/**
 * Atualizar ave com validações
 */
const _updateWithValidation = async (id, data, tr = prisma) => {
    // Validar anilha única (se alterada)
    if (data.anilha) {
        const isUnique = await _isAnilhaUnique(data.anilha, id)
        if (!isUnique) {
            throw new Error('Anilha já cadastrada no sistema')
        }
    }

    // Validar data não futura
    if (data.nascimento && new Date(data.nascimento) > new Date()) {
        throw new Error('Data de nascimento não pode ser futura')
    }

    // Validar relacionamentos (se alterados)
    if (data.paiId !== undefined || data.maeId !== undefined) {
        await _validateGenealogiaRelationship(id, data)
    }

    // Atualizar ave
    return await tr.ave.update({
        where: { id },
        data
    })
}

/**
 * Buscar genealogia completa de uma ave
 * @param {string} id - ID da ave
 * @param {number} geracoes - Profundidade da árvore (máx: 10)
 * @returns {Promise<Object>} Ave com genealogia completa
 */
const _getGenealogiaCompleta = async (id, geracoes = 5) => {
    if (geracoes > 10) {
        throw new Error('Máximo de 10 gerações permitidas')
    }

    // Função recursiva para construir a árvore
    const buildGenealogia = async (aveId, depth) => {
        if (depth <= 0 || !aveId) return null

        const ave = await prisma.ave.findUnique({
            where: { id: aveId }
        })

        if (!ave) return null

        // Recursivamente buscar ancestrais
        if (depth > 1) {
            ave.pai = ave.paiId
                ? await buildGenealogia(ave.paiId, depth - 1)
                : null
            ave.mae = ave.maeId
                ? await buildGenealogia(ave.maeId, depth - 1)
                : null
        }

        return ave
    }

    const arvore = await buildGenealogia(id, geracoes)

    if (!arvore) {
        throw new Error('Ave não encontrada')
    }

    // Calcular estatísticas
    const calcularEstatisticas = (ave, depth = 1) => {
        let total = 0
        let maxDepth = depth

        if (ave.pai) {
            const stats = calcularEstatisticas(ave.pai, depth + 1)
            total += stats.total + 1
            maxDepth = Math.max(maxDepth, stats.maxDepth)
        }

        if (ave.mae) {
            const stats = calcularEstatisticas(ave.mae, depth + 1)
            total += stats.total + 1
            maxDepth = Math.max(maxDepth, stats.maxDepth)
        }

        return { total, maxDepth }
    }

    const estatisticas = calcularEstatisticas(arvore)

    return {
        ...arvore,
        estatisticas: {
            totalAncestrias: estatisticas.total,
            geracoes: estatisticas.maxDepth
        }
    }
}

/**
 * Buscar todos os descendentes (filhos) de uma ave
 * @param {string} id - ID da ave
 * @returns {Promise<Array>} Lista de filhos
 */
const _getDescendentes = async (id) => {
    const filhosPai = await prisma.ave.findMany({
        where: { paiId: id },
        include: {
            mae: {
                select: { id: true, nome: true, anilha: true }
            }
        }
    })

    const filhosMae = await prisma.ave.findMany({
        where: { maeId: id },
        include: {
            pai: {
                select: { id: true, nome: true, anilha: true }
            }
        }
    })

    // Combinar e remover duplicados
    const todosFilhos = [...filhosPai, ...filhosMae]
    const uniqueFilhos = Array.from(
        new Map(todosFilhos.map(f => [f.id, f])).values()
    )

    return uniqueFilhos.map(filho => ({
        ...filho,
        outroPaiMae: filho.pai || filho.mae
    }))
}

/**
 * Listar aves disponíveis para serem pais (MACHO ou INDETERMINADO)
 * @returns {Promise<Array>} Lista de aves
 */
const _getAvesDisponiveisPai = async () => {
    return await prisma.ave.findMany({
        where: {
            sexo: { in: ['MACHO', 'INDETERMINADO'] }
        },
        select: {
            id: true,
            nome: true,
            anilha: true,
            sexo: true,
            nascimento: true
        },
        orderBy: { nome: 'asc' }
    })
}

/**
 * Listar aves disponíveis para serem mães (FEMEA ou INDETERMINADO)
 * @returns {Promise<Array>} Lista de aves
 */
const _getAvesDisponiveisMae = async () => {
    return await prisma.ave.findMany({
        where: {
            sexo: { in: ['FEMEA', 'INDETERMINADO'] }
        },
        select: {
            id: true,
            nome: true,
            anilha: true,
            sexo: true,
            nascimento: true
        },
        orderBy: { nome: 'asc' }
    })
}

/**
 * Controller customizado para operações específicas de Aves
 */
const aveController = {
    // Herda métodos base
    ...aveBaseController,

    /**
     * POST customizado com validações adicionais
     */
    post: async (request, reply) => {
        const { id: _, ...body } = request.body
        const data = await _createWithValidation(body)
        reply.code(201).send(data)
    },

    /**
     * PUT customizado com validações adicionais
     */
    put: async (request, reply) => {
        const { id } = request.params
        const { id: _, ...body } = request.body
        const data = await _updateWithValidation(id, body)
        reply.send(data)
    },

    /**
     * GET /aves/:id/genealogia - Buscar árvore genealógica completa
     */
    getGenealogiaCompleta: async (request, reply) => {
        const { id } = request.params
        const { geracoes = 5 } = request.query

        const data = await _getGenealogiaCompleta(id, Number(geracoes))
        reply.send(data)
    },

    /**
     * GET /aves/:id/descendentes - Buscar filhos de uma ave
     */
    getDescendentes: async (request, reply) => {
        const { id } = request.params

        const data = await _getDescendentes(id)
        reply.send({
            data,
            meta: {
                total: data.length
            }
        })
    },

    /**
     * GET /aves/disponiveis/pais - Listar aves que podem ser pais
     */
    getDisponiveisPai: async (request, reply) => {
        const data = await _getAvesDisponiveisPai()
        reply.send({ data })
    },

    /**
     * GET /aves/disponiveis/maes - Listar aves que podem ser mães
     */
    getDisponiveisMae: async (request, reply) => {
        const data = await _getAvesDisponiveisMae()
        reply.send({ data })
    }
}

export { aveController }
export default aveController
