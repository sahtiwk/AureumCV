/**
 * Optional analysis worker (the current webcam uses FaceLandmarkManager directly).
 * 
 * This worker receives raw landmark data from the main thread and runs
 * all expensive CPU-bound math off the main UI thread:
 *   - Temporal EMA smoothing
 *   - Phi / symmetry geometry calculations
 *   - Quality scoring (blur, lighting, occlusion, pose)
 *
 * The WASM loader does not require window or document.
 */

import { WasmGeometryEngine } from '@/geometry/WasmGeometryEngine';
import { QualityAssessor } from '@/ml/QualityAssessor';
import { TemporalSmoother } from '@/ml/TemporalSmoother';
import type { Landmark, FaceAnalysisResult } from '@/types';

export interface WorkerInput {
  type: 'ANALYZE';
  rawLandmarks: Landmark[];
  imageBitmap: ImageBitmap; // zero-copy transferred
}

export interface WorkerOutput {
  type: 'RESULT';
  result: FaceAnalysisResult | null;
}

const geometryReady = WasmGeometryEngine.init();

self.onmessage = async (event: MessageEvent<WorkerInput>) => {
  const { type, rawLandmarks, imageBitmap } = event.data;

  if (type !== 'ANALYZE') return;

  try {
    await geometryReady;
    // Step 1: Temporal smoothing (eliminates micro-jitter)
    const landmarks = TemporalSmoother.smooth(rawLandmarks);

    // Step 2: C++ geometry + Phi computations, with a TypeScript fallback
    const phiMetrics = WasmGeometryEngine.analyze(landmarks) || undefined;

    // Step 3: Quality scoring using the transferred ImageBitmap
    const qualityMetrics = QualityAssessor.assess(imageBitmap, landmarks);

    const result: FaceAnalysisResult = {
      landmarks,
      phiMetrics,
      qualityMetrics,
    };

    const output: WorkerOutput = { type: 'RESULT', result };
    (self as unknown as Worker).postMessage(output);
  } catch (e) {
    console.warn('[analysis.worker] Error:', e);
    const output: WorkerOutput = { type: 'RESULT', result: null };
    (self as unknown as Worker).postMessage(output);
  } finally {
    imageBitmap.close();
  }
};
