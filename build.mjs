import { rmSync } from 'node:fs'
import { build } from 'esbuild'

// Limpa a pasta dist antes de gerar novo build
rmSync('dist', { recursive: true, force: true })

await build({
    entryPoints: ['src/index.js'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    outdir: 'dist',
    format: 'esm',
    // Prefere entrada CJS dos pacotes para evitar problemas de interop de default export
    mainFields: ['main', 'module'],
    // Dialetos opcionais do knex/sequelize não instalados no projeto
    external: [
        'throttled-queue',
        'tedious',
        'pg-hstore',
        'pg-query-stream',
        'better-sqlite3',
        'sqlite3',
        'mysql',
        'oracledb',
    ],
})