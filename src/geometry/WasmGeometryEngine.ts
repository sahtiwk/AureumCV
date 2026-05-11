import { Landmark, PhiMetrics } from '@/types';

declare global {
  interface Window {
    createGeometryModule: any;
  }
}

export class WasmGeometryEngine {
  private static wasmModule: any = null;
  private static isInitialized = false;
  private static initPromise: Promise<void> | null = null;

  public static async init(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise<void>(async (resolve, reject) => {
      try {
        if (typeof window === 'undefined') return resolve();

        if (!window.createGeometryModule) {
          await new Promise<void>((res, rej) => {
            const script = document.createElement('script');
            script.src = '/wasm/geometry.js';
            script.onload = () => res();
            script.onerror = () => rej(new Error('Failed to load Wasm script'));
            document.body.appendChild(script);
          });
        }

        if (window.createGeometryModule) {
          this.wasmModule = await window.createGeometryModule({
            locateFile: (path: string) => `/wasm/${path}`
          });
          this.isInitialized = true;
          resolve();
        } else {
          reject(new Error("createGeometryModule not found on window"));
        }
      } catch (err) {
        reject(err);
      }
    });

    return this.initPromise;
  }

  public static analyze(landmarks: Landmark[]): PhiMetrics | null {
    if (landmarks.length !== 478) return null;

    if (!this.isInitialized || !this.wasmModule) {
      // Fallback to JS implementation if WASM is not ready
      return this.analyzeJs(landmarks);
    }

    try {
      // Flatten landmarks to Float32Array
      const floatArray = new Float32Array(478 * 3);
      for (let i = 0; i < 478; i++) {
        floatArray[i * 3] = landmarks[i].x;
        floatArray[i * 3 + 1] = landmarks[i].y;
        floatArray[i * 3 + 2] = landmarks[i].z;
      }

      // Allocate memory in Wasm heap
      const numBytes = floatArray.length * floatArray.BYTES_PER_ELEMENT;
      const ptr = this.wasmModule._malloc(numBytes);
      
      // Copy data to Wasm heap
      this.wasmModule.HEAPF32.set(floatArray, ptr / 4);

      // Call analyzeFace: float* analyzeFace(float* flattenedLandmarks, int numFloats)
      const resultPtr = this.wasmModule.ccall(
        'analyzeFace', 
        'number', 
        ['number', 'number'], 
        [ptr, floatArray.length]
      );

      // Read results from Wasm heap
      const results = new Float32Array(this.wasmModule.HEAPF32.buffer, resultPtr, 4);

      // Free allocated memory
      this.wasmModule._free(ptr);

      if (results[0] === -1) return this.analyzeJs(landmarks);

      return {
        facialRatio: results[0],
        eyeSpacingRatio: results[1],
        symmetryScore: results[2],
        phiScore: results[3]
      };
    } catch (err) {
      console.warn("Wasm analysis failed, falling back to JS:", err);
      return this.analyzeJs(landmarks);
    }
  }

  private static analyzeJs(landmarks: Landmark[]): PhiMetrics {
    const getDist = (p1: Landmark, p2: Landmark) => {
      return Math.sqrt(
        Math.pow(p2.x - p1.x, 2) +
        Math.pow(p2.y - p1.y, 2) +
        Math.pow(p2.z - p1.z, 2)
      );
    };

    // h: top of forehead (10) to bottom of chin (152)
    // w: cheek to cheek (234 to 454)
    const h = getDist(landmarks[10], landmarks[152]);
    const w = getDist(landmarks[234], landmarks[454]);
    const facialRatio = w > 0 ? h / w : 0;

    // Eye spacing: distance between inner corners (133, 362) vs eye widths
    const leftEyeW = getDist(landmarks[33], landmarks[133]);
    const rightEyeW = getDist(landmarks[263], landmarks[362]);
    const interEyeDist = getDist(landmarks[133], landmarks[362]);
    const eyeSpacingRatio = (leftEyeW + rightEyeW) > 0 ? interEyeDist / ((leftEyeW + rightEyeW) / 2) : 0;

    // Symmetry: Nose tip (1) distance to cheekbones (234, 454)
    const distLeft = getDist(landmarks[1], landmarks[234]);
    const distRight = getDist(landmarks[1], landmarks[454]);
    const diff = Math.abs(distLeft - distRight);
    const maxDist = Math.max(distLeft, distRight);
    const symmetryScore = maxDist > 0 ? 100 * (1 - diff / maxDist) : 100;

    const phiIdeal = 1.618;
    const phiDeviation = Math.abs(facialRatio - phiIdeal);
    const phiScore = 100 * Math.max(0, 1 - phiDeviation / phiIdeal);

    return {
      facialRatio,
      eyeSpacingRatio,
      symmetryScore,
      phiScore
    };
  }
}
