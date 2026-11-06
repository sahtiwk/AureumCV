import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { manifestPath, fingerprints, validateBinary } from './wasm-artifact.mjs';
process.chdir(fileURLToPath(new URL('..', import.meta.url)));
try {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const [key, value] of Object.entries(fingerprints())) {
    if (manifest[key] !== value) throw new Error(`WASM artifact is stale: ${key}`);
  }
  await validateBinary();
  console.log('Geometry WASM artifact verified.');
} catch (error) {
  console.error(`${error.message}\nRun npm run build:wasm with an activated Emscripten SDK and include the updated binary and manifest.`);
  process.exitCode = 1;
}
