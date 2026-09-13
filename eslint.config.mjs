import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-console': 'error',
      'no-debugger': globalThis.process?.env?.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-case-declarations': 'off',
      'no-empty': 'off',
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['**/modules/*/infrastructure/repositories/**'],
            message: 'Do not import from modules/*/infrastructure/repositories/** — import from modules/<name> (root) or modules/<name>/infrastructure (barrel) instead.',
          },
        ],
      }],
      // Code complexity rules
      complexity: ['warn', { max: 15 }],
      'max-lines-per-function': ['warn', { max: 150, skipComments: true }],
      'max-params': ['warn', { max: 5 }],
      'max-depth': ['warn', { max: 5 }],
      'max-lines': ['warn', { max: 500, skipComments: true }],
      // Ban expect([array]).toContain(x) and expect([array].includes(x)).toBe(true)
      'no-restricted-syntax': ['error',
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='toContain'][callee.object.type='CallExpression'][callee.object.callee.name='expect'][callee.object.arguments.0.type='ArrayExpression']",
          message: 'Do not use expect([array]).toContain(x). Assert a single expected value with expect(x).toBe(y) instead.',
        },
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='toBe'][callee.object.type='CallExpression'][callee.object.callee.name='expect'][callee.object.arguments.0.type='CallExpression'][callee.object.arguments.0.callee.type='MemberExpression'][callee.object.arguments.0.callee.property.name='includes'][callee.object.arguments.0.callee.object.type='ArrayExpression']",
          message: 'Do not use expect([array].includes(x)).toBe(true). Assert a single expected value with expect(x).toBe(y) instead.',
        },
      ],
    },
  },
  {
    files: ['**/interface/jobs/**/*.ts', 'scripts/**/*.ts', 'tests/**/*.ts'],
    rules: {
      'no-console': 'off',
      // Relax complexity rules for tests and scripts
      complexity: 'off',
      'max-lines-per-function': 'off',
      'max-params': 'off',
      'max-depth': 'off',
      'max-lines': 'off',
    },
  },
  {
    files: ['boot/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      'public/',
      'docs/',
      'migrations/',
      'seeds/',
      'infra/',
      '**/*.d.ts',
      '**/*.js',
      'app.mjs',
      '!eslint.config.mjs',
      '.env*',
      '!.env.example',
    ],
  },
];
