import { rmSync } from 'node:fs'
import { build } from 'esbuild'
import { globSync } from 'glob'

rmSync('dist', { recursive: true, force: true })

const assets = globSync('src/**/*.{ejs,html,ttf,css,csv}')
const database = globSync('src/database/**/*.{ts,js}')

await build({
  entryPoints: [
    ...assets,
    ...database,
    'src/application/index.js',
  ],
  outdir: 'dist',
  outbase: 'src',
  bundle: true,
  minify: true,
  platform: 'node',
  target: 'node20',
  packages: 'external',
  loader: {
    '.ejs': 'copy',
    '.html': 'copy',
    '.ttf': 'copy',
    '.css': 'copy',
    '.csv': 'copy',
  }
})
