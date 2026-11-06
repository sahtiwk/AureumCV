import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Compile only the browser bridge for these Node tests, not a math implementation.
const directory = mkdtempSync(join(tmpdir(), 'aureum-wasm-test-'));
const require = createRequire(import.meta.url);
const enginePath = join(directory, 'WasmGeometryEngine.js');
writeFileSync(enginePath, ts.transpileModule(
  readFileSync(new URL('../src/geometry/WasmGeometryEngine.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText);
const { WasmGeometryEngine: engine } = require(enginePath);
const bytes = readFileSync(new URL('../public/wasm/geometry.wasm', import.meta.url));
const originalFetch = globalThis.fetch;
test.after(() => { globalThis.fetch = originalFetch; rmSync(directory, { recursive: true }); });

const face = () => {
  const points = Array.from({ length: 478 }, () => ({ x: 0, y: 0, z: 0 }));
  points[10].y = -1.618;
  points[152].y = 1.618;
  points[234].x = -1;
  points[454].x = 1;
  points[33].x = -0.75;
  points[133].x = -0.25;
  points[362].x = 0.25;
  points[263].x = 0.75;
  return points;
};
const checkKnownMetrics = points => {
  const actual = engine.analyze(points);
  const expected = { facialRatio: 1.618, eyeSpacingRatio: 1, symmetryScore: 100, phiScore: 100 };
  for (const [key, value] of Object.entries(expected)) assert.ok(Math.abs(actual[key] - value) < 0.0002, key);
};

test('missing binary rejects analysis; initialization can retry and shares concurrent requests', async () => {
  globalThis.fetch = async () => new Response('missing', { status: 404 });
  await assert.rejects(engine.init(), /C\+\+ analysis engine could not load/);
  assert.equal(engine.backend, 'unavailable');
  assert.throws(() => engine.analyze(face()), /not ready/);
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

test('C++ metrics match known geometry across rotations, translations and scales', () => {
  checkKnownMetrics(face());
  for (let i = 1; i <= 1000; i++) {
    const angle = i * 0.01;
    const scale = 0.1 + i / 100;
    checkKnownMetrics(face().map(({x,y,z}) => ({
      x: (x * Math.cos(angle) - y * Math.sin(angle)) * scale + 0.5,
      y: (x * Math.sin(angle) + y * Math.cos(angle)) * scale - 0.2,
      z: z * scale + 0.1,
    })));
  }
});

test('degenerate and malformed inputs are handled', () => {
  assert.deepEqual(engine.analyze(Array.from({ length: 478 }, () => ({ x: 0, y: 0, z: 0 }))),
    { facialRatio: 0, eyeSpacingRatio: 0, symmetryScore: 100, phiScore: 0 });
  assert.equal(engine.analyze([]), null);
  const points = face();
  points[1].x = NaN;
  assert.equal(engine.analyze(points), null);
  points[1].x = Infinity;
  assert.equal(engine.analyze(points), null);
});

test('repeated analysis releases input allocations', () => {
  const points = face();
  for (let i = 0; i < 10000; i++) assert.ok(engine.analyze(points));
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
    `, { eval: true, workerData: { bytes, enginePath, points: face() } });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', code => { if (code) reject(new Error(`Worker exited ${code}`)); });
  });
  assert.equal(result.backend, 'wasm');
  assert.ok(Number.isFinite(result.metrics.phiScore));
});

test('runtime failure frees memory and rejects instead of switching engines', async () => {
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
    assert.throws(() => failingEngine.analyze(face()), /C\+\+ analysis engine failed/);
    assert.equal(failingEngine.backend, 'unavailable');
    assert.equal(frees, 1);
  } finally {
    WebAssembly.instantiate = instantiate;
  }
});
