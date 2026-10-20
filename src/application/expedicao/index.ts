import { type Knex } from 'knex'

import { authorize } from '@/application/AuthorizeMiddlewareFactory'
import { AdicionaParticipanteUseCase } from '@/domain/expedicao/AdicionaParticipanteUseCase'
import { AtualizaExpedicaoUseCase } from '@/domain/expedicao/AtualizaExpedicaoUseCase'
import { BuscaExpedicaoUseCase } from '@/domain/expedicao/BuscaExpedicaoUseCase'
import { CadastraExpedicaoUseCase } from '@/domain/expedicao/CadastraExpedicaoUseCase'
import { DeletaExpedicaoUseCase } from '@/domain/expedicao/DeletaExpedicaoUseCase'
import { ListaExpedicoesUseCase } from '@/domain/expedicao/ListaExpedicoesUseCase'
import { RemoveParticipanteUseCase } from '@/domain/expedicao/RemoveParticipanteUseCase'
import { SubstituiRotasUseCase } from '@/domain/expedicao/SubstituiRotasUseCase'
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
      path: '/v2/expedicoes',
      handlers: [
        authorize('create', 'Expedicao'),
        new CadastraExpedicaoController({
          cadastraExpedicaoUseCase: new CadastraExpedicaoUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Get,
      path: '/v2/expedicoes',
      handlers: [
        authorize('read', 'Expedicao'),
        new ListaExpedicoesController({
          listaExpedicoesUseCase: new ListaExpedicoesUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Get,
      path: '/v2/expedicoes/:expedicaoId',
      handlers: [
        authorize('read', 'Expedicao'),
        new BuscaExpedicaoController({
          buscaExpedicaoUseCase: new BuscaExpedicaoUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Delete,
      path: '/v2/expedicoes/:expedicaoId',
      handlers: [
        authorize('delete', 'Expedicao'),
        new DeletaExpedicaoController({
          deletaExpedicaoUseCase: new DeletaExpedicaoUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Put,
      path: '/v2/expedicoes/:expedicaoId',
      handlers: [
        authorize('update', 'Expedicao'),
        new AtualizaExpedicaoController({
          atualizaExpedicaoUseCase: new AtualizaExpedicaoUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Post,
      path: '/v2/expedicoes/:expedicaoId/participantes',
      handlers: [
        authorize('update', 'Expedicao'),
        new AdicionaParticipanteController({
          adicionaParticipanteUseCase: new AdicionaParticipanteUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Delete,
      path: '/v2/expedicoes/:expedicaoId/participantes/:usuarioId',
      handlers: [
        authorize('update', 'Expedicao'),
        new RemoveParticipanteController({
          removeParticipanteUseCase: new RemoveParticipanteUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Put,
      path: '/v2/expedicoes/:expedicaoId/rotas',
      handlers: [
        authorize('update', 'Expedicao'),
        new SubstituiRotasController({
          SubstituiRotasUseCase: new SubstituiRotasUseCase({ expedicaoCollection })
        })
      ]
    }
  ]
}
