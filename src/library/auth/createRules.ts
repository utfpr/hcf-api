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
  'Vegetacao',
  'Cidade',
  'Usuario',
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

export function createRules(user: { id: number; tipo_usuario_id: number }): Rule<Resource, Action>[] {
  const isAllowedToWrite = [1, 2].includes(user.tipo_usuario_id)

  if (!isAllowedToWrite) {
    return []
  }

  return [
    {
      action: [
        'read',
        'create',
        'update',
        'delete'
      ],
      resource: 'Vegetacao'
    }
  ]
}
