import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
export const flags = ['--no-entry', '-O3', '-s', 'STANDALONE_WASM=1',
  '-s', 'EXPORTED_FUNCTIONS=_analyzeFace,_malloc,_free'];
export const source = 'src/wasm/geometry.cpp';
export const binary = 'public/wasm/geometry.wasm';
export const manifestPath = 'public/wasm/geometry.manifest.json';
const hash = value => createHash('sha256').update(value).digest('hex');
export function fingerprints() {
  return {
    // Git may check out CRLF on Windows and LF on deployment hosts.
    sourceSha256: hash(readFileSync(source, 'utf8').replace(/\r\n/g, '\n')),
    binarySha256: hash(readFileSync(binary)),
    flagsSha256: hash(JSON.stringify(flags)),
  };
}
export async function validateBinary() {
  const compiled = await WebAssembly.compile(readFileSync(binary));
  if (WebAssembly.Module.imports(compiled).length) throw new Error('Geometry WASM must be self-contained');
  const { exports } = await WebAssembly.instantiate(compiled);
  for (const key of ['malloc', 'free', 'analyzeFace', '_initialize']) {
    if (typeof exports[key] !== 'function') throw new Error(`Missing WASM export: ${key}`);
  }
  if (!(exports.memory instanceof WebAssembly.Memory)) throw new Error('Missing WASM memory');
  exports._initialize();
}
