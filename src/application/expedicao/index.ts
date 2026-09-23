import { type Knex } from 'knex'
import { Method } from '@/library/http/common'
import { Route } from '@/library/http/Router'
import { createExpedicaoCollection } from '@/factory/ExpedicaoCollectionFactory'
import { AdicionaParticipanteUseCase } from '@/domain/expedicao/AdcionaParticipanteUseCase'
import { AdicionaParticipanteController } from './AdicionaParticipanteController'
import { RemoveParticipanteUseCase } from '@/domain/expedicao/RemoveParticipanteUseCase'
import { RemoveParticipanteController } from './RemoveParticipanteController'
import { SubstituiRotasController } from './SubstituirRotaController'
import { SubstituiRotasUseCase } from '@/domain/expedicao/SubstituiRotaUseCase'


export function routes(knex: Knex): Route[] {
  const expedicaoCollection = createExpedicaoCollection()

  return [
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
