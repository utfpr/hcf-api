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
  'Solo',
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
  'Lembrete',
  'LocalColeta'
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

export const CURADOR = 1
export const OPERADOR = 2
export const IDENTIFICADOR = 3
export const EXPEDICIONARIO = 4

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

  if ([
    CURADOR,
    OPERADOR,
    IDENTIFICADOR,
    EXPEDICIONARIO
  ].includes(user.tipo_usuario_id)) {
    rules.push({ action: 'read', resource: 'LocalColeta' })
  }

  if (user.tipo_usuario_id === CURADOR || user.tipo_usuario_id === OPERADOR) {
    rules.push(
      { action: 'create', resource: 'FaseSucessional' },
      { action: 'update', resource: 'FaseSucessional' },
      { action: 'delete', resource: 'FaseSucessional' },
      { action: 'create', resource: 'Vegetacao' },
      { action: 'update', resource: 'Vegetacao' },
      { action: 'delete', resource: 'Vegetacao' },
      { action: 'create', resource: 'Solo' },
      { action: 'update', resource: 'Solo' },
      { action: 'delete', resource: 'Solo' },
      { action: 'create', resource: 'Relevo' },
      { action: 'update', resource: 'Relevo' },
      { action: 'delete', resource: 'Relevo' },
      { action: 'create', resource: 'LocalColeta' },
      { action: 'update', resource: 'LocalColeta' },
      { action: 'delete', resource: 'LocalColeta' },
      { action: 'create', resource: 'Expedicao' },
      { action: 'update', resource: 'Expedicao' },
      { action: 'delete', resource: 'Expedicao' },
      { action: 'create', resource: 'Evento' },
      { action: 'update', resource: 'Evento' },
      { action: 'delete', resource: 'Evento' },
      { action: 'create', resource: 'Evidencia' },
      { action: 'update', resource: 'Evidencia' },
      { action: 'delete', resource: 'Evidencia' },
      { action: 'create', resource: 'Lembrete' },
      { action: 'update', resource: 'Lembrete' },
      { action: 'delete', resource: 'Lembrete' }
    )
  }

  // Expedicionário cria livremente (a participação na expedição é checada por
  // AutorizaExpedicionarioMiddleware) e só altera/exclui o que ele criou.
  if (user.tipo_usuario_id === EXPEDICIONARIO) {
    const proprios = { created_by: user.id }
    rules.push(
      { action: 'create', resource: 'Evento' },
      {
        action: ['update', 'delete'], resource: 'Evento', conditions: proprios
      },
      { action: 'create', resource: 'Lembrete' },
      {
        action: ['update', 'delete'], resource: 'Lembrete', conditions: proprios
      },
      { action: 'create', resource: 'Evidencia' },
      {
        action: 'delete', resource: 'Evidencia', conditions: proprios
      }
    )
  }

  return rules
}
