import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import type { ESLint } from 'eslint'
// @ts-expect-error: No declaration file found
import importHelpers from 'eslint-plugin-import-helpers'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    ignores: [
      'dist/',
      'mysql/',
      'public/',
      'node_modules/'
    ]
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: {
      js,
      stylistic,
      tseslint,
      'import-helpers': importHelpers as unknown as ESLint.Plugin
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json'
      },
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    extends: [
      'js/recommended',
      stylistic.configs.customize({
        braceStyle: '1tbs',
        indent: 4,
        semi: true,
        commaDangle: 'always-multiline',
        quotes: 'single'
      }),
      tseslint.configs.recommended
    ],
    rules: {
      'no-console': 'error',
      'one-var': ['error', 'never'],
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/one-var-declaration-per-line': ['error', 'always'],
      '@stylistic/quotes': [
        'error',
        'single',
        { avoidEscape: true }
      ],
      '@stylistic/quote-props': ['error', 'as-needed'],
      'import-helpers/order-imports': [
        'warn',
        {
          newlinesBetween: 'always',
          groups: [
            'module',
            '/^@//',
            '/^~/',
            [
              'parent',
              'sibling',
              'index'
            ]
          ],
          alphabetize: {
            order: 'asc',
            ignoreCase: true
          }
        }
      ],
      '@stylistic/padded-blocks': [
        'error',
        { classes: 'always' }
      ]
    }
  },
  {
    files: ['**/*.{ts,mts,cts}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      stylistic.configs.customize({
        braceStyle: '1tbs',
        commaDangle: 'never'
      })
    ],
    rules: {
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/array-bracket-newline': [
        'error',
        {
          multiline: true,
          minItems: 3
        }
      ],
      '@stylistic/array-element-newline': [
        'error',
        {
          multiline: true,
          consistent: true,
          minItems: 3
        }
      ],
      '@stylistic/member-delimiter-style': [
        'error',
        {
          multiline: {
            delimiter: 'none',
            requireLast: false
          },
          singleline: {
            delimiter: 'semi',
            requireLast: false
          }
        }
      ],
      '@typescript-eslint/no-explicit-any': [
        'error',
        { ignoreRestArgs: true }
      ],
      '@typescript-eslint/no-unused-vars': 'off', // handled by tsc (noUnusedLocals)
      '@stylistic/object-curly-newline': [
        'error',
        {
          ObjectExpression: {
            multiline: true,
            consistent: true,
            minProperties: 3
          },
          ObjectPattern: {
            multiline: true,
            consistent: true,
            minProperties: 3
          },
          ImportDeclaration: {
            multiline: true,
            consistent: true,
            minProperties: 3
          },
          ExportDeclaration: {
            multiline: true,
            consistent: true,
            minProperties: 3
          }
        }
      ],
      '@stylistic/object-property-newline': [
        'error',
        { allowAllPropertiesOnSameLine: true }
      ]
    }
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off'
    }
  },
  {
    files: ['src/database/migration/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off'
    }
  }
])
