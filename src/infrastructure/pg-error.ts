/**
 * Códigos de erro (SQLSTATE) do Postgres que a camada de infraestrutura
 * precisa reconhecer para traduzir Either.left em um status HTTP correto,
 * em vez de cair tudo como 500 genérico.
 */
export const PG_FOREIGN_KEY_VIOLATION = '23503'
export const PG_CHECK_VIOLATION = '23514'

export function pgErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}
