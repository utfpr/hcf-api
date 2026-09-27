import { ApagaUsuarioSessaoUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessaoUseCase'
import { ApagaUsuarioSessoesUseCase } from '@/domain/usuarioSessao/ApagaUsuarioSessoesUseCase'
import { type Either } from '@/library/either/Either'

interface Dependencies {
  apagaUsuarioSessaoUseCase: ApagaUsuarioSessaoUseCase
  apagaUsuarioSessoesUseCase: ApagaUsuarioSessoesUseCase
}

export class EncerraSessaoUseCase {
  private readonly apagaUsuarioSessaoUseCase: ApagaUsuarioSessaoUseCase
  private readonly apagaUsuarioSessoesUseCase: ApagaUsuarioSessoesUseCase

  constructor(dependencies: Dependencies) {
    this.apagaUsuarioSessaoUseCase = dependencies.apagaUsuarioSessaoUseCase
    this.apagaUsuarioSessoesUseCase = dependencies.apagaUsuarioSessoesUseCase
  }

  async execute(params: {
    all: boolean
    usuarioId?: number
    sessaoId?: string
  }): Promise<Either<Error, void>> {
    if (params.all) {
      return this.apagaUsuarioSessoesUseCase.execute({ usuarioId: params.usuarioId as number })
    }

    return this.apagaUsuarioSessaoUseCase.execute({ id: params.sessaoId as string })
  }
}
