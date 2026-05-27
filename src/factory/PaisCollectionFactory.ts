import { PaisCollectionKnexAdapter } from '@/infrastructure/PaisCollectionKnexAdapter'

import { createKnexInstance } from './KnexFactory'

let instance: PaisCollectionKnexAdapter | null = null

export function createPaisCollection(): PaisCollectionKnexAdapter {
  if (!instance) {
    instance = new PaisCollectionKnexAdapter({ knex: createKnexInstance() })
  }
  return instance
}
