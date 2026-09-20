import { type Knex } from 'knex'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'
import { CadastraExpedicaoUseCase } from '@/domain/expedicao/CadastraExpedicaoUseCase'
import { CadastraExpedicaoController } from './CadastraExpedicaoController'
import { createExpedicaoCollection } from '@/factory/ExpedicaoCollectionFactory' 
import { ListaExpedicoesUseCase } from '@/domain/expedicao/ListaExpedicoesUseCase'
import { ListaExpedicoesController } from './ListaExpedicoesController'
import { BuscaExpedicaoUseCase } from '@/domain/expedicao/BuscaExpedicaoUseCase'
import { BuscaExpedicaoController } from './BuscaExpedicaoController'

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
    },
    {
      method: Method.Get,
      path: '/v2/expedicoes',
      handlers: [
        new ListaExpedicoesController({
          listaExpedicoesUseCase: new ListaExpedicoesUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Get,
      path: '/v2/expedicoes/:expedicaoId', // <-- O :expedicaoId é o que chega no request.params
      handlers: [
        new BuscaExpedicaoController({
          buscaExpedicaoUseCase: new BuscaExpedicaoUseCase({ expedicaoCollection })
        })
      ]
    }
  ]
}
