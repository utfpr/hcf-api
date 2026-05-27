import { EstadoCollectionKnexAdapter } from '@/infrastructure/EstadoCollectionKnexAdapter'
import { singleton } from '@/library/singleton'

import { createKnexInstance } from './KnexFactory'

export const createEstadoCollection = singleton(() => {
  return new EstadoCollectionKnexAdapter({ knex: createKnexInstance() })
})
