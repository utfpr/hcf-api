import { ExpedicaoCollectionKnexAdapter } from '@/infrastructure/ExpedicaoCollectionKnexAdapter'
import { singleton } from '@/library/singleton'

import { createKnexInstance } from './KnexFactory'

export const createExpedicaoCollection = singleton(() => {
  return new ExpedicaoCollectionKnexAdapter({ knex: createKnexInstance() })
})
