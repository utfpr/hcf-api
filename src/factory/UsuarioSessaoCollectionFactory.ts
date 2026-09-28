import { UsuarioSessaoCollectionKnexAdapter } from '@/infrastructure/UsuarioSessaoCollectionKnexAdapter'
import { singleton } from '@/library/singleton'

import { createKnexInstance } from './KnexFactory'

export const createUsuarioSessaoCollection = singleton(() => {
  return new UsuarioSessaoCollectionKnexAdapter({ knex: createKnexInstance() })
})
