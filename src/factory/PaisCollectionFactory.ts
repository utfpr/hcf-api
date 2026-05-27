import { PaisCollectionKnexAdapter } from '@/infrastructure/PaisCollectionKnexAdapter'
import { singleton } from '@/library/singleton'

import { createKnexInstance } from './KnexFactory'

export const createPaisCollection = singleton(() => {
  return new PaisCollectionKnexAdapter({ knex: createKnexInstance() })
})
