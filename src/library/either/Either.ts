interface EitherLike<T> {
  readonly value: T
  left(): this is Left<Error>
  right(): this is Right<T>
}

export class Left<T extends Error> implements EitherLike<T> {
  readonly value: T
  readonly tag = 'left'

  constructor(value: T) {
    this.value = value
  }

  left(): this is Left<T> {
    return true
  }

  right(): this is Right<T> {
    return false
  }
}

export class Right<T> implements EitherLike<T> {
  readonly value: T
  readonly tag = 'right'

  constructor(value: T) {
    this.value = value
  }

  left(): this is Left<Error> {
    return false
  }

  right(): this is Right<T> {
    return true
  }
}

export type Either<L extends Error, R> = Left<L> | Right<R>

export const Either = Object.freeze({
  right<T>(value: T) {
    return new Right(value)
  },
  left<T extends Error>(value: T) {
    return new Left(value)
  },
})
