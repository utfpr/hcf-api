declare global {
  type EnumOf<T> = T[keyof T]
}

export {}
