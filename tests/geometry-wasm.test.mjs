import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const directory = mkdtempSync(join(tmpdir(), 'aureum-wasm-test-'));
const require = createRequire(import.meta.url);
for (const name of ['PoseEstimator', 'GeometryEngine', 'WasmGeometryEngine']) {
  const source = readFileSync(new URL(`../src/geometry/${name}.ts`, import.meta.url), 'utf8');
  writeFileSync(join(directory, `${name}.js`), ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText);
}
const { GeometryEngine } = require(join(directory, 'GeometryEngine.js'));
const { WasmGeometryEngine: engine } = require(join(directory, 'WasmGeometryEngine.js'));
const bytes = readFileSync(new URL('../public/wasm/geometry.wasm', import.meta.url));
const originalFetch = globalThis.fetch;
test.after(() => { globalThis.fetch = originalFetch; rmSync(directory, { recursive: true }); });

let seed = 42;
const random = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 2 ** 32);
const face = () => Array.from({ length: 478 }, () => ({ x: random(), y: random(), z: random() - 0.5 }));
const compare = points => {
  const actual = engine.analyze(points);
  const expected = GeometryEngine.analyze(points);
  for (const key of Object.keys(expected)) {
    assert.ok(Math.abs(actual[key] - expected[key]) <= 0.0002 * Math.max(1, Math.abs(expected[key])),
      `${key}: WASM ${actual[key]}, TypeScript ${expected[key]}`);
  }
};

test('missing binary falls back; a later initialization retries and shares concurrent requests', async () => {
  globalThis.fetch = async () => new Response('missing', { status: 404 });
  await engine.init();
  assert.equal(engine.backend, 'typescript');
  compare(face());
  let requests = 0;
  globalThis.fetch = async url => {
    assert.equal(url, '/wasm/geometry.wasm');
    requests++;
    return new Response(bytes);
  };
  await Promise.all([engine.init(), engine.init(), engine.init()]);
  assert.equal(requests, 1);
  assert.equal(engine.backend, 'wasm');
});

test('real C++ WASM matches TypeScript on 1000 deterministic landmark sets', () => {
  assert.equal(engine.backend, 'wasm');
  for (let i = 0; i < 1000; i++) compare(face());
  assert.equal(engine.backend, 'wasm'); // A fallback must not disguise a failed WASM test.
});

test('degenerate and malformed inputs are handled', () => {
  compare(Array.from({ length: 478 }, () => ({ x: 0, y: 0, z: 0 })));
  const points = face();
  points[454] = { ...points[234] };
  compare(points);
  assert.equal(engine.analyze([]), null);
  points[1].x = NaN;
  assert.equal(engine.analyze(points), null);
  points[1].x = Infinity;
  assert.equal(engine.analyze(points), null);
});

test('repeated analysis releases input allocations', () => {
  const points = face();
  for (let i = 0; i < 10000; i++) assert.ok(engine.analyze(points));
  // Leaking 5736 bytes per frame would exhaust the fixed WASM memory here.
  assert.equal(engine.backend, 'wasm');
});

test('standalone binary runs in a worker without DOM or imports', async () => {
  const { Worker } = await import('node:worker_threads');
  const result = await new Promise((resolve, reject) => {
    const worker = new Worker(`
      const { parentPort, workerData } = require('node:worker_threads');
      (async () => {
        global.fetch = async () => new Response(workerData.bytes);
        const { WasmGeometryEngine } = require(workerData.enginePath);
        await WasmGeometryEngine.init();
        const metrics = WasmGeometryEngine.analyze(workerData.points);
        parentPort.postMessage({ backend: WasmGeometryEngine.backend, metrics });
      })().catch(error => { throw error; });
    `, { eval: true, workerData: { bytes, enginePath: join(directory, 'WasmGeometryEngine.js'), points: face() } });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', code => { if (code) reject(new Error(`Worker exited ${code}`)); });
  });
  assert.equal(result.backend, 'wasm');
  assert.ok(Number.isFinite(result.metrics.phiScore));
});

test('a WASM runtime exception frees the allocation and falls back', async () => {
  const enginePath = join(directory, 'WasmGeometryEngine.js');
  delete require.cache[enginePath];
  const { WasmGeometryEngine: failingEngine } = require(enginePath);
  const instantiate = WebAssembly.instantiate;
  let frees = 0;
  WebAssembly.instantiate = async (...args) => {
    const result = await instantiate(...args);
    const exports = result.instance.exports;
    return { ...result, instance: { exports: { ...exports,
      analyzeFace() { throw new WebAssembly.RuntimeError('test trap'); },
      free(pointer) { frees++; exports.free(pointer); },
    } } };
  };
  try {
    await failingEngine.init();
    assert.equal(failingEngine.backend, 'wasm');
    const points = face();
    assert.deepEqual(failingEngine.analyze(points), GeometryEngine.analyze(points));
    assert.equal(failingEngine.backend, 'typescript');
    assert.equal(frees, 1);
  } finally {
    WebAssembly.instantiate = instantiate;
  }
});
