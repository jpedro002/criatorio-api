import { z } from 'zod'

// Schema para criação de Ave
export const createAveSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').trim(),
    anilha: z.string().min(1, 'Anilha é obrigatória').max(50, 'Anilha muito longa').trim(),
    nascimento: z.string().datetime({ message: 'Data de nascimento inválida' }),
    cig: z.string().min(1, 'CIG é obrigatório').max(50, 'CIG muito longo').trim(),
    sexo: z.enum(['MACHO', 'FEMEA', 'INDETERMINADO'], {
        errorMap: () => ({ message: 'Sexo deve ser MACHO, FEMEA ou INDETERMINADO' })
    }),
    paiId: z.string().uuid().optional().nullable(),
    maeId: z.string().uuid().optional().nullable(),
})

// Schema para atualização (todos os campos opcionais)
export const updateAveSchema = createAveSchema.partial()

// Schema para resposta de Ave
export const aveResponseSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    anilha: z.string(),
    nascimento: z.string().datetime(),
    cig: z.string(),
    sexo: z.enum(['MACHO', 'FEMEA', 'INDETERMINADO']),
    paiId: z.string().uuid().nullable(),
    maeId: z.string().uuid().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
})

// Schema para genealogia (recursivo)
export const genealogiaSchema = z.lazy(() => z.object({
    id: z.string().uuid(),
    nome: z.string(),
    anilha: z.string(),
    nascimento: z.string().datetime(),
    cig: z.string(),
    sexo: z.enum(['MACHO', 'FEMEA', 'INDETERMINADO']),
    pai: genealogiaSchema.optional().nullable(),
    mae: genealogiaSchema.optional().nullable()
}))

// Schema de parâmetros ID
export const idParamSchema = z.object({
    id: z.string().uuid()
})

// Schema de query para filtros (seguindo padrão baseRouter)
export const queryFilterSchema = z.object({
    term: z.string().optional(),
    fields: z.union([z.array(z.string()), z.string(), z.undefined()])
        .optional()
        .transform(val => {
            if (Array.isArray(val)) return val
            if (typeof val === 'string') return [val]
            return []
        }),
    order: z.string().optional(),
    orderDirection: z.enum(['asc', 'desc']).default('asc').optional(),
    fspecifics: z.string().optional()
})

// Schema de paginação
export const paginationQuerySchema = queryFilterSchema.extend({
    page: z.coerce.number().positive().optional().default(1),
    pageSize: z.coerce.number().positive().optional().default(20)
})
