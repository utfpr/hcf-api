import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { AtualizaExpedicaoUseCase } from '@/domain/expedicao/AtualizaExpedicaoUseCase'
import { CadastraExpedicaoUseCase } from '@/domain/expedicao/CadastraExpedicaoUseCase'
import { createExpedicaoCollection } from '@/factory/ExpedicaoCollectionFactory'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'

import { AdicionaParticipanteController } from './AdicionaParticipanteController'
import { AtualizaExpedicaoController } from './AtualizaExpedicaoController'
import { BuscaExpedicaoController } from './BuscaExpedicaoController'
import { CadastraExpedicaoController } from './CadastraExpedicaoController'
import { DeletaExpedicaoController } from './DeletaExpedicaoController'
import { ListaExpedicoesController } from './ListaExpedicoesController'
import { RemoveParticipanteController } from './RemoveParticipanteController'
import { SubstituiRotasController } from './SubstituiRotasController'

export function routes(knex: Knex): Route[] {
  const expedicaoCollection = createExpedicaoCollection()

  return [
    {
      method: Method.Post,
      path: '/v1/expedicoes',
      handlers: [
        authorize('create', 'Expedicao'),
        new CadastraExpedicaoController({
          cadastraExpedicaoUseCase: new CadastraExpedicaoUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Get,
      path: '/v1/expedicoes',
      handlers: [
        authorize('read', 'Expedicao'),
        new ListaExpedicoesController({ expedicaoCollection })
      ]
    },
    {
      method: Method.Get,
      path: '/v1/expedicoes/:expedicaoId',
      handlers: [
        authorize('read', 'Expedicao'),
        new BuscaExpedicaoController({ expedicaoCollection })
      ]
    },
    {
      method: Method.Delete,
      path: '/v1/expedicoes/:expedicaoId',
      handlers: [
        authorize('delete', 'Expedicao'),
        new DeletaExpedicaoController({ expedicaoCollection })
      ]
    },
    {
      method: Method.Put,
      path: '/v1/expedicoes/:expedicaoId',
      handlers: [
        authorize('update', 'Expedicao'),
        new AtualizaExpedicaoController({
          atualizaExpedicaoUseCase: new AtualizaExpedicaoUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Post,
      path: '/v1/expedicoes/:expedicaoId/participantes',
      handlers: [
        authorize('update', 'Expedicao'),
        new AdicionaParticipanteController({ expedicaoCollection })
      ]
    },
    {
      method: Method.Delete,
      path: '/v1/expedicoes/:expedicaoId/participantes/:usuarioId',
      handlers: [
        authorize('update', 'Expedicao'),
        new RemoveParticipanteController({ expedicaoCollection })
      ]
    },
    {
      method: Method.Put,
      path: '/v1/expedicoes/:expedicaoId/rotas',
      handlers: [
        authorize('update', 'Expedicao'),
        new SubstituiRotasController({ expedicaoCollection })
      ]
    }
  ]
}
