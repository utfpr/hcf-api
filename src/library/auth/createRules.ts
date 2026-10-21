import { type Rule } from './Manager'

export const ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'export',
  'approve'
] as const

export const RESOURCES = [
  'Tombo',
  'Reino',
  'Familia',
  'Subfamilia',
  'Genero',
  'Especie',
  'Subespecie',
  'Variedade',
  'Autor',
  'Pais',
  'Estado',
  'FaseSucessional',
  'Vegetacao',
  'Cidade',
  'Usuario',
  'UsuarioSessao',
  'Identificador',
  'Herbario',
  'Coletor',
  'Reflora',
  'SpeciesLink',
  'Pendencia',
  'Remessa',
  'Upload',
  'Relatorio',
  'Local',
  'Darwin',
  'Splink'
] as const

export type Action = typeof ACTIONS[number]
export type Resource = typeof RESOURCES[number]

export type RulesUser = { id: number; tipo_usuario_id: number }

const publicReads: Rule<Resource, Action>[] = [
  { action: 'read', resource: 'Pais' },
  { action: 'read', resource: 'Estado' },
  { action: 'read', resource: 'Vegetacao' }
]

const FASE_SUCESSIONAL_WRITER_TIPOS = new Set([1, 2])
const CURADOR = 1
const OPERADOR = 2

export function createRules(user?: RulesUser): Rule<Resource, Action>[] {
  if (user === undefined) {
    return [...publicReads]
  }

  const rules: Rule<Resource, Action>[] = [...publicReads, { action: 'read', resource: 'UsuarioSessao' }]

  if (FASE_SUCESSIONAL_WRITER_TIPOS.has(user.tipo_usuario_id)) {
    rules.push(
      { action: 'create', resource: 'FaseSucessional' },
      { action: 'update', resource: 'FaseSucessional' },
      { action: 'delete', resource: 'FaseSucessional' }
  const rules: Rule<Resource, Action>[] = [
    ...publicReads,
    { action: 'read', resource: 'UsuarioSessao' }
  ]

  if (user.tipo_usuario_id === CURADOR || user.tipo_usuario_id === OPERADOR) {
    rules.push(
      { action: 'create', resource: 'Vegetacao' },
      { action: 'update', resource: 'Vegetacao' },
      { action: 'delete', resource: 'Vegetacao' }
    )
  }

  return rules
}
