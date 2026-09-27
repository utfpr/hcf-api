import { UsuarioCollectionKnexAdapter } from '@/infrastructure/UsuarioCollectionKnexAdapter'
import { singleton } from '@/library/singleton'

import { createKnexInstance } from './KnexFactory'

export const createUsuarioCollection = singleton(() => {
  return new UsuarioCollectionKnexAdapter({ knex: createKnexInstance() })
})
