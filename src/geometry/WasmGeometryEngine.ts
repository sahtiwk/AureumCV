import type { Landmark, PhiMetrics } from '@/types';

interface GeometryExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory;
  malloc(size: number): number;
  free(pointer: number): void;
  analyzeFace(pointer: number, length: number): number;
  _initialize(): void;
}

/** Browser bridge to the C++ metrics engine. No alternative math implementation. */
export class WasmGeometryEngine {
  private static module: GeometryExports | null = null;
  private static initPromise: Promise<void> | null = null;
  public static get backend(): 'wasm' | 'unavailable' {
    return this.module ? 'wasm' : 'unavailable';
  }

  public static init(): Promise<void> {
    if (this.module) return Promise.resolve();
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      try {
        const response = await fetch('/wasm/geometry.wasm', { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error(`Geometry WASM: HTTP ${response.status}`);
        const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
        const exports = instance.exports as GeometryExports;
        if (!(exports.memory instanceof WebAssembly.Memory) ||
            typeof exports.analyzeFace !== 'function' ||
            typeof exports.malloc !== 'function' || typeof exports.free !== 'function' ||
            typeof exports._initialize !== 'function') {
          throw new Error('Geometry WASM exports are incompatible');
        }
        exports._initialize();
        this.module = exports;
        console.info('[geometry] C++ WebAssembly engine ready');
      } catch (error) {
        throw new Error('The C++ analysis engine could not load. Please reload and try again.', { cause: error });
      }
    })().finally(() => { this.initPromise = null; });
    return this.initPromise;
  }

  public static analyze(landmarks: Landmark[]): PhiMetrics | null {
    if (landmarks.length !== 478 || landmarks.some(p =>
      !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z))) return null;
    const wasm = this.module;
    if (!wasm) throw new Error('The C++ analysis engine is not ready. Please reload and try again.');
    let pointer = 0;
    try {
      pointer = wasm.malloc(478 * 3 * 4);
      if (!pointer) throw new Error('Geometry WASM allocation failed');
      const input = new Float32Array(wasm.memory.buffer, pointer, 478 * 3);
      landmarks.forEach((point, i) => {
        input[i * 3] = point.x;
        input[i * 3 + 1] = point.y;
        input[i * 3 + 2] = point.z;
      });
      const resultPointer = wasm.analyzeFace(pointer, input.length);
      const [facialRatio, eyeSpacingRatio, symmetryScore, phiScore] =
        new Float32Array(wasm.memory.buffer, resultPointer, 4);
      if (![facialRatio, eyeSpacingRatio, symmetryScore, phiScore].every(Number.isFinite) || facialRatio < 0) {
        throw new Error('Geometry WASM returned invalid metrics');
      }
      return { facialRatio, eyeSpacingRatio, symmetryScore, phiScore };
    } catch (error) {
      this.module = null;
      throw new Error('The C++ analysis engine failed. Please reload and try again.', { cause: error });
    } finally {
      if (pointer) wasm.free(pointer);
    }
  }
}
