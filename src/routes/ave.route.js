import { baseRouter } from './base.route.js'
import { aveController } from '../controllers/index.js'
import {
    createAveSchema,
    updateAveSchema,
    aveResponseSchema,
    genealogiaSchema,
    idParamSchema
} from '../schemas/ave.schema.js'
import { z } from 'zod'

/**
 * Plugin de rotas de Aves
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function aveRoutes(fastify) {
    // Registrar rotas CRUD padrão usando baseRouter
    baseRouter(fastify, aveController, {
        tag: 'Aves',
        entityName: 'ave',
        schemas: {
            createSchema: createAveSchema,
            updateSchema: updateAveSchema,
            entitySchema: z.any()
        }
    })

    // Rotas customizadas adicionais

    // GET /disponiveis/pais - ANTES das rotas com :id
    fastify.get('/disponiveis/pais', {
        handler: aveController.getDisponiveisPai,
        schema: {
            tags: ['Aves'],
            summary: 'Listar aves disponíveis para serem pais',
            description: 'Lista aves com sexo MACHO ou INDETERMINADO'
        }
    })

    // GET /disponiveis/maes
    fastify.get('/disponiveis/maes', {
        handler: aveController.getDisponiveisMae,
        schema: {
            tags: ['Aves'],
            summary: 'Listar aves disponíveis para serem mães',
            description: 'Lista aves com sexo FEMEA ou INDETERMINADO'
        }
    })

    // GET /:id/genealogia
    fastify.get('/:id/genealogia', {
        handler: aveController.getGenealogiaCompleta,
        schema: {
            tags: ['Aves'],
            summary: 'Obter árvore genealógica completa',
            description: 'Retorna a ave com toda sua genealogia até N gerações',
            params: idParamSchema,
            querystring: z.object({
                geracoes: z.coerce.number().int().min(1).max(10).default(5)
            })
        }
    })

    // GET /:id/descendentes
    fastify.get('/:id/descendentes', {
        handler: aveController.getDescendentes,
        schema: {
            tags: ['Aves'],
            summary: 'Obter descendentes de uma ave',
            description: 'Lista todos os filhos (diretos) de uma ave',
            params: idParamSchema
        }
    })
}
