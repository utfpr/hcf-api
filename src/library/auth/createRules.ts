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

export const GUEST_USER = {
  id: 0,
  nome: 'Guest',
  email: '',
  tipo_usuario_id: 0
} as const

const publicReads: Rule<Resource, Action>[] = [
  { action: 'read', resource: 'Pais' },
  { action: 'read', resource: 'Estado' }
]

export function createRules(user: { id: number; tipo_usuario_id: number }): Rule<Resource, Action>[] {
  if (user.tipo_usuario_id === 0) {
    return [...publicReads]
  }

  return [...publicReads, { action: 'read', resource: 'UsuarioSessao' }]
}
