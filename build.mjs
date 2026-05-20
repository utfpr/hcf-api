import { rmSync } from 'node:fs'
import { globSync } from 'glob'
import { build } from 'esbuild'


rmSync('dist', { recursive: true, force: true }) // Limpa a pasta dist antes de gerar novo build


const entryPoints = globSync('src/**/*.{js,ts,ejs,tsx}') // Encontra todos os arquivos a serem transpilados

await build({
    entryPoints,
    bundle: false,
    platform: 'node',
    target: 'node22',
    outdir: 'dist',
    format: 'esm',
})