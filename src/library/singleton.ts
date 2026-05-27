export function singleton<T>(factory: () => T): () => T {
  let instance: null | T = null

  return () => {
    if (!instance) {
      instance = factory()
    }
    return instance
  }
}
