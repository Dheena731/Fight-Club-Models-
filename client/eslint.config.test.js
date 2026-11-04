import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'

const eslint = new ESLint({ cwd: fileURLToPath(new URL('.', import.meta.url)) })

test('React lint migration keeps JSX, DOM and hooks diagnostics active', async () => {
  const cases = [
    ['export const Example = () => <Missing />;', 'no-undef'],
    ['export const Example = () => [1].map(value => <span>{value}</span>);', '@eslint-react/no-missing-key'],
    ['export const Example = () => [<span key="same" />, <span key="same" />];', '@eslint-react/no-duplicate-key'],
    ['export const Example = () => <div class="wrong" />;', '@eslint-react/dom-no-unknown-property'],
    ['import {useState} from "react"; export function Example({ready}) { if (ready) useState(0); return null; }', 'react-hooks/rules-of-hooks'],
    ['import {useEffect} from "react"; export function Example({value}) { useEffect(() => { console.log(value); }, []); return null; }', 'react-hooks/exhaustive-deps'],
  ]
  for (const [code, rule] of cases) {
    const [result] = await eslint.lintText(code, { filePath: 'src/nested/lint-probe.jsx' })
    assert(result.messages.some(message => message.ruleId === rule), `${rule}: ${JSON.stringify(result.messages)}`)
  }
  const [valid] = await eslint.lintText('export const Example = () => <span>ok</span>;', { filePath: 'src/nested/lint-probe.jsx' })
  assert.equal(valid.errorCount, 0, JSON.stringify(valid.messages))
  assert.equal(await eslint.isPathIgnored('dist/assets/example.js'), true)
  assert.equal(await eslint.isPathIgnored('src/screens/Home.jsx'), false)
})

test('scoped minimatch updates retain consumer APIs and ESLint source discovery', async () => {
  for (const consumer of ['eslint', '@eslint/config-array', '@typescript-eslint/typescript-estree']) {
    const require = createRequire(import.meta.resolve(consumer))
    const { Minimatch, minimatch } = require('minimatch')
    assert.equal(new Minimatch('src/**/*.{js,jsx}').match('src/screens/Home.jsx'), true)
    assert.equal(new Minimatch('src/**/*.jsx').match('src/screens', true), true)
    assert.equal(minimatch('src/.probe.jsx', 'src/*.jsx', { dot: true }), true)
    assert.equal(minimatch('src/probe.css', 'src/*.jsx'), false)
  }
  const results = await eslint.lintFiles(['src/**/*.{js,jsx}', 'vite.config.js'])
  assert(results.some(result => result.filePath.endsWith('Home.jsx')))
  assert(results.some(result => result.filePath.endsWith('vite.config.js')))
})
