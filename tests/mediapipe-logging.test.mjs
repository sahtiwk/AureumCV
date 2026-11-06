import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/ml/MediaPipeLogging.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { withMediaPipeLogging } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);

test('captured native logger classifies only the exact startup line and restores console', async () => {
  const error = console.error;
  const info = console.info;
  const errors = [];
  const infos = [];
  const errorSink = (...args) => errors.push(args);
  console.error = errorSink;
  console.info = (...args) => infos.push(args);
  try {
    let captured;
    await withMediaPipeLogging(async () => { captured = console.error.bind(console); });
    assert.equal(console.error, errorSink);
    captured('INFO: Created TensorFlow Lite XNNPACK delegate for CPU.');
    captured('ERROR: XNNPACK delegate failed');
    captured('gl_context: context lost');
    captured('INFO: Created TensorFlow Lite XNNPACK delegate for CPU.', new Error('additional failure'));
    assert.equal(infos.length, 1);
    assert.equal(errors.length, 3);
    await assert.rejects(withMediaPipeLogging(async () => { throw new Error('init failed'); }), /init failed/);
    assert.equal(console.error, errorSink);
  } finally {
    console.error = error;
    console.info = info;
  }
});

test('concurrent initializations keep the logger until both finish', async () => {
  const original = console.error;
  let finish;
  const pending = withMediaPipeLogging(() => new Promise(resolve => { finish = resolve; }));
  const routed = console.error;
  await withMediaPipeLogging(async () => {});
  assert.equal(console.error, routed);
  finish();
  await pending;
  assert.equal(console.error, original);
});
