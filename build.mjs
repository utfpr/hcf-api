import { rmSync } from 'node:fs'
import { build } from 'esbuild'

// Limpa a pasta dist antes de gerar novo build
rmSync('dist', { recursive: true, force: true })

await build({
    entryPoints: ['src/index.js'],
    bundle: false,
    platform: 'node',
    target: 'node22',
    outdir: 'dist',
    format: 'esm',
})