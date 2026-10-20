import createKnex, { Knex } from 'knex'
import { loadEnvFile } from 'node:process'

try {
  loadEnvFile('.env.test')
} catch {
  // In CI, environment variables are injected directly into the process
}

const TABLES = [
  'estados',
  'paises',
  'fase_sucessional',
  'lembretes',
  'evidencias',
  'eventos_coletas',
  'eventos',
  'expedicoes_rotas',
  'expedicoes_participantes',
  'expedicoes',
  'expedicoes_rotas_locais_coleta',
  'locais_coleta'
]

async function truncateTables(knex: Knex): Promise<void> {
  await knex.raw(`TRUNCATE TABLE ${TABLES.join(', ')} CASCADE`)
}

// Curador (1) e Operador (2) são fixos nas regras de autorização e compartilhados
// entre as suítes; o sequence avança para que as seeds criem os próprios tipos a
// partir do 3 e, ao limpá-los, nunca apaguem um tipo que outra suíte esteja usando.
async function seedTiposUsuarios(knex: Knex): Promise<void> {
  await knex('tipos_usuarios')
    .insert([{ id: 1, tipo: 'Curador' }, { id: 2, tipo: 'Operador' }])
    .onConflict('id')
    .ignore()
  await knex.raw(
    'SELECT setval(\'tipos_usuarios_id_seq\', GREATEST((SELECT MAX(id) FROM tipos_usuarios), 2))'
  )
}

export async function setup(): Promise<void> {
  const {
    PG_DATABASE,
    PG_HOST,
    PG_PORT = '5432',
    PG_USERNAME,
    PG_PASSWORD
  } = process.env

  const knex = createKnex({
    client: 'postgres',
    connection: {
      database: PG_DATABASE,
      host: PG_HOST,
      port: parseInt(PG_PORT, 10),
      user: PG_USERNAME,
      password: PG_PASSWORD
    }
  })

  try {
    await knex.raw('SELECT 1')
    await truncateTables(knex)
    await seedTiposUsuarios(knex)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Cannot prepare the test database (${PG_HOST}:${PG_PORT}/${PG_DATABASE}): ${reason}. `
      + 'Start the container (schema is applied on first boot) — '
      + 'see test/integration/README.md'
    )
  } finally {
    await knex.destroy().catch(() => undefined)
  }
}

export async function teardown(): Promise<void> {
  // Container lifecycle is managed by the developer — see test/integration/README.md
}
