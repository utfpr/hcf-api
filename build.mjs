import { rmSync } from 'node:fs'
import { build } from 'esbuild'
import { globSync } from 'glob'

rmSync('dist', { recursive: true, force: true })

const files = globSync('src/**/*.{ejs,html,ttf,css}')

await build({
    entryPoints: [
        ...files,
        'src/index.js',
    ],
    outdir: 'dist',
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
    }
})
