import { type Knex } from 'knex'

import { AtualizaExpedicaoUseCase } from '@/domain/expedicao/AtualizaExpedicaoUseCase'
import { BuscaExpedicaoUseCase } from '@/domain/expedicao/BuscaExpedicaoUseCase'
import { CadastraExpedicaoUseCase } from '@/domain/expedicao/CadastraExpedicaoUseCase'
import { DeletaExpedicaoUseCase } from '@/domain/expedicao/DeletaExpedicaoUseCase'
import { ListaExpedicoesUseCase } from '@/domain/expedicao/ListaExpedicoesUseCase'
import { createExpedicaoCollection } from '@/factory/ExpedicaoCollectionFactory'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { AtualizaExpedicaoController } from './AtualizaExpedicaoController'
import { BuscaExpedicaoController } from './BuscaExpedicaoController'
import { CadastraExpedicaoController } from './CadastraExpedicaoController'
import { DeletaExpedicaoController } from './DeletaExpedicaoController'
import { ListaExpedicoesController } from './ListaExpedicoesController'

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
      path: '/v2/expedicoes/:expedicaoId',
      handlers: [
        new BuscaExpedicaoController({
          buscaExpedicaoUseCase: new BuscaExpedicaoUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Delete,
      path: '/v2/expedicoes/:expedicaoId',
      handlers: [
        new DeletaExpedicaoController({
          deletaExpedicaoUseCase: new DeletaExpedicaoUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Put,
      path: '/v2/expedicoes/:expedicaoId',
      handlers: [
        new AtualizaExpedicaoController({
          atualizaExpedicaoUseCase: new AtualizaExpedicaoUseCase({ expedicaoCollection })
        })
      ]
    }
  ]
}
