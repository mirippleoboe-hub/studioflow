import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/personalization.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { normalizePersonalization, defaultPersonalization } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
test('old accounts and malformed metadata preserve a complete usable menu', () => {
  for (const value of [null, undefined, {}, { palette: '__proto__', menuOrder: 'students' }]) {
    assert.deepEqual(normalizePersonalization(value), defaultPersonalization);
  }
  const result = normalizePersonalization({ palette: 'forest', menuOrder: ['lessons', 'lessons', 'bogus', null, 'settings'] });
  assert.equal(result.palette, 'forest');
  assert.deepEqual(result.menuOrder.slice(0, 2), ['lessons', 'settings']);
  assert.equal(result.menuOrder.length, defaultPersonalization.menuOrder.length);
  assert.deepEqual([...result.menuOrder].sort(), [...defaultPersonalization.menuOrder].sort());
});
