import { Either } from '@/library/either/Either'

import { EstadoDoPaisAttributes, PaisCollection } from './PaisCollection'

interface Dependencies {
  paisCollection: PaisCollection
}

interface Input {
  sigla: string
}

export class ListaEstadosPaisUseCase {
  private readonly paisCollection: PaisCollection

  constructor(dependencies: Dependencies) {
    this.paisCollection = dependencies.paisCollection
  }

  async execute(input: Input): Promise<Either<Error, EstadoDoPaisAttributes[]>> {
    return this.paisCollection.findEstadosBySigla({ sigla: input.sigla })
  }
}
