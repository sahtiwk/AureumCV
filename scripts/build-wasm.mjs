import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { flags, source, binary, manifestPath, fingerprints, validateBinary } from './wasm-artifact.mjs';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
mkdirSync('public/wasm', { recursive: true });
// Arguments are fixed project paths and flags; Windows needs a shell for emcc.bat.
function emcc(args) {
  const result = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', ['emcc', ...args].join(' ')], { encoding: 'utf8' })
    : spawnSync('emcc', args, { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    throw new Error(`${result.error?.message ?? result.stderr}\nActivate the Emscripten SDK, then run npm run build:wasm.`);
  }
  return result.stdout;
}
const compiler = emcc(['--version']).split(/\r?\n/)[0];
emcc([source, ...flags, '-o', binary]);
await validateBinary();
writeFileSync(manifestPath, JSON.stringify({ compiler, ...fingerprints() }, null, 2) + '\n');
console.log(`Built and validated ${binary} with ${compiler}`);
