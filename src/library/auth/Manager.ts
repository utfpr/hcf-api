import {
  AbilityBuilder,
  createMongoAbility,
  subject,
  type MongoAbility
} from '@casl/ability'

export interface Rule<R extends string = string, A extends string = string> {
  action: A | A[]
  resource: R
  conditions?: object
}

export class Manager<R extends string, A extends string> {
  private readonly ability: MongoAbility

  readonly rules: Rule<R, A>[]

  constructor(params: { rules: Rule<R, A>[] }) {
    const builder = new AbilityBuilder(createMongoAbility)

    for (const rule of params.rules) {
      builder.can(rule.action as string, rule.resource as string, rule.conditions)
    }

    this.ability = builder.build()
    this.rules = params.rules
  }

  can(action: A, resource: R, record?: object): boolean {
    if (record) {
      return this.ability.can(action, subject(resource, record))
    }

    return this.ability.can(action, resource)
  }

  canAny(actions: A[], resource: R, record?: object): boolean {
    if (!actions.length) return false
    return actions.some(action => this.can(action, resource, record))
  }

  canAll(actions: A[], resource: R, record?: object): boolean {
    if (!actions.length) return false
    return actions.every(action => this.can(action, resource, record))
  }
}
