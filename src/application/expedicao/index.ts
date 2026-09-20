import { type Knex } from 'knex'

import { CadastraExpedicaoUseCase } from '@/domain/expedicao/CadastraExpedicaoUseCase'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { CadastraExpedicaoController } from './CadastraExpedicaoController'
import { createExpedicaoCollection } from '@/factory/ExpedicaoCollectionFactory' 

export function routes(knex: Knex): Route[] {
  const expedicaoCollection = createExpedicaoCollection()

  return [
    {
      method: Method.Post,
      path: '/v2/expedicoes',
      handlers: [
        new CadastraExpedicaoController({
          cadastraExpedicaoUseCase: new CadastraExpedicaoUseCase({ expedicaoCollection })
        })
      ]
    }
  ]
}
