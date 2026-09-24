import { type Knex } from 'knex'

import { AdicionaParticipanteUseCase } from '@/domain/expedicao/AdcionaParticipanteUseCase'
import { AtualizaExpedicaoUseCase } from '@/domain/expedicao/AtualizaExpedicaoUseCase'
import { BuscaExpedicaoUseCase } from '@/domain/expedicao/BuscaExpedicaoUseCase'
import { CadastraExpedicaoUseCase } from '@/domain/expedicao/CadastraExpedicaoUseCase'
import { DeletaExpedicaoUseCase } from '@/domain/expedicao/DeletaExpedicaoUseCase'
import { ListaExpedicoesUseCase } from '@/domain/expedicao/ListaExpedicoesUseCase'
import { RemoveParticipanteUseCase } from '@/domain/expedicao/RemoveParticipanteUseCase'
import { SubstituiRotasUseCase } from '@/domain/expedicao/SubstituiRotaUseCase'
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
import { SubstituiRotasController } from './SubstituirRotaController'

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
    },
    {
      method: Method.Post,
      path: '/v2/expedicoes/:expedicaoId/participantes',
      handlers: [
        new AdicionaParticipanteController({
          adicionaParticipanteUseCase: new AdicionaParticipanteUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Delete,
      path: '/v2/expedicoes/:expedicaoId/participantes/:usuarioId',
      handlers: [
        new RemoveParticipanteController({
          removeParticipanteUseCase: new RemoveParticipanteUseCase({ expedicaoCollection })
        })
      ]
    },
    {
      method: Method.Put,
      path: '/v2/expedicoes/:expedicaoId/rotas',
      handlers: [
        new SubstituiRotasController({
          SubstituiRotasUseCase: new SubstituiRotasUseCase({ expedicaoCollection })
        })
      ]
    }
  ]
}
