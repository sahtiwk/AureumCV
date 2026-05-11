/**
 * Phase 9 — Analysis Web Worker
 * 
 * This worker receives raw landmark data from the main thread and runs
 * all expensive CPU-bound math off the main UI thread:
 *   - Temporal EMA smoothing
 *   - Canonical 3D pose normalization
 *   - Phi / symmetry geometry calculations
 *   - Quality scoring (blur, lighting, occlusion, pose)
 *
 * The main thread stays clean for React rendering + MediaPipe GPU inference.
 */

import { GeometryEngine } from '@/geometry/GeometryEngine';
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

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  const { type, rawLandmarks, imageBitmap } = event.data;

  if (type !== 'ANALYZE') return;

  try {
    // Step 1: Temporal smoothing (eliminates micro-jitter)
    const landmarks = TemporalSmoother.smooth(rawLandmarks);

    // Step 2: Geometry + Phi computations (canonical 3D math)
    const phiMetrics = GeometryEngine.analyze(landmarks) || undefined;

    // Step 3: Quality scoring using the transferred ImageBitmap
    const qualityMetrics = QualityAssessor.assess(imageBitmap, landmarks);

    // Release the bitmap memory
    imageBitmap.close();

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
  }
};
