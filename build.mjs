import { rmSync } from 'node:fs'
import { globSync } from 'glob'
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'

rmSync('dist', { recursive: true, force: true }) // Limpa a pasta dist antes de gerar novo build

await build({
    entryPoints: ['src/index.js', 'src/setup.js'],
    bundle: true,
    packages: 'external',
    platform: 'node',
    target: 'node22',
    outdir: 'dist',
    format: 'cjs',
})
