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
  'Relevo',
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
  'Splink',
  'Expedicao',
  'Evento',
  'Evidencia',
  'Lembrete'
] as const

export type Action = typeof ACTIONS[number]
export type Resource = typeof RESOURCES[number]

export type RulesUser = { id: number; tipo_usuario_id: number }

const publicReads: Rule<Resource, Action>[] = [
  { action: 'read', resource: 'Pais' },
  { action: 'read', resource: 'Estado' },
  { action: 'read', resource: 'Vegetacao' },
  { action: 'read', resource: 'FaseSucessional' },
  { action: 'read', resource: 'Relevo' }
]

const CURADOR = 1
const OPERADOR = 2

export function createRules(user?: RulesUser): Rule<Resource, Action>[] {
  if (user === undefined) {
    return [...publicReads]
  }

  const rules: Rule<Resource, Action>[] = [
    ...publicReads,
    { action: 'read', resource: 'UsuarioSessao' },
    { action: 'read', resource: 'Expedicao' },
    { action: 'read', resource: 'Evento' },
    { action: 'read', resource: 'Evidencia' },
    { action: 'read', resource: 'Lembrete' }
  ]

  if (user.tipo_usuario_id === CURADOR || user.tipo_usuario_id === OPERADOR) {
    rules.push(
      { action: 'create', resource: 'FaseSucessional' },
      { action: 'update', resource: 'FaseSucessional' },
      { action: 'delete', resource: 'FaseSucessional' },
      { action: 'create', resource: 'Vegetacao' },
      { action: 'update', resource: 'Vegetacao' },
      { action: 'delete', resource: 'Vegetacao' },
      { action: 'create', resource: 'Relevo' },
      { action: 'update', resource: 'Relevo' },
      { action: 'delete', resource: 'Relevo' },
      { action: 'create', resource: 'Expedicao' },
      { action: 'update', resource: 'Expedicao' },
      { action: 'delete', resource: 'Expedicao' },
      { action: 'create', resource: 'Evento' },
      { action: 'update', resource: 'Evento' },
      { action: 'delete', resource: 'Evento' },
      { action: 'create', resource: 'Evidencia' },
      { action: 'delete', resource: 'Evidencia' },
      { action: 'create', resource: 'Lembrete' },
      { action: 'update', resource: 'Lembrete' },
      { action: 'delete', resource: 'Lembrete' }
    )
  }

  return rules
}
