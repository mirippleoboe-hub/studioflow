import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/safe-redirect.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext}});
const { safeNextPath } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
test('redirects preserve local routes and reject external destinations', () => {
  assert.equal(safeNextPath('/students?q=oboe'), '/students?q=oboe');
  for (const value of [null, '', 'https://other.test', '//other.test', '/\\other.test', '/\n/other.test']) {
    assert.equal(safeNextPath(value), '/dashboard');
  }
});
