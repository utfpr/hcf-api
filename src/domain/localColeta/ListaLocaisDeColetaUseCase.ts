import { LocalColetaCollection, LocalColetaFilters } from './LocalColetaCollection'

interface Dependencies {
  localColetaCollection: LocalColetaCollection
}

export class ListaLocaisDeColetaUseCase {
  private readonly localColetaCollection: LocalColetaCollection

  constructor(dependencies: Dependencies) {
    this.localColetaCollection = dependencies.localColetaCollection
  }

  execute(filters: LocalColetaFilters) {
    return this.localColetaCollection.findAll(filters)
  }
}
