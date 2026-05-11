import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { FaceAnalysisResult, Landmark } from '@/types';
import { GeometryEngine } from '@/geometry/GeometryEngine';
import { QualityAssessor } from './QualityAssessor';
import { TemporalSmoother } from './TemporalSmoother';

// Internal type for raw MediaPipe output
type RawLandmark = { x: number; y: number; z: number; visibility?: number };

export class FaceLandmarkManager {
  private static instance: FaceLandmarker | null = null;     // VIDEO mode (live camera)
  private static imageInstance: FaceLandmarker | null = null; // IMAGE mode (static upload)
  private static isInitializing = false;

  public static async getInstance(): Promise<FaceLandmarker> {
    if (this.instance) return this.instance;
    if (this.isInitializing) {
      // Wait for initialization to complete if already requested
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (this.instance) {
            clearInterval(check);
            resolve(this.instance);
          }
        }, 100);
      });
    }

    this.isInitializing = true;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      this.instance = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/face_landmarker.task",
          delegate: "GPU"
        },
        outputFaceBlendshapes: false,
        runningMode: "VIDEO",
        numFaces: 1
      });
      
      this.isInitializing = false;
      return this.instance;
    } catch (error) {
      this.isInitializing = false;
      console.error("Failed to initialize FaceLandmarker:", error);
      throw error;
    }
  }

  /**
   * Phase 9: Returns only raw MediaPipe landmarks (runs on main thread, GPU-accelerated).
   * The heavy math is then sent to the analysis Web Worker.
   */
  public static detectRawLandmarks(videoElement: HTMLVideoElement, timestamp: number): Landmark[] | null {
    if (!this.instance) return null;

    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'string' && (args[0].includes('XNNPACK') || args[0].includes('gl_context') || args[0].includes('FaceBlendshapesGraph'))) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    try {
      const result = this.instance.detectForVideo(videoElement, timestamp);
      console.error = originalConsoleError;

      if (result?.faceLandmarks?.length > 0) {
        return result.faceLandmarks[0].map((pt: RawLandmark) => ({
          x: pt.x,
          y: pt.y,
          z: pt.z,
          visibility: pt.visibility ?? 1,
        }));
      }
    } catch (e) {
      console.error = originalConsoleError;
      console.warn('Detection error:', e);
    }

    console.error = originalConsoleError;
    return null;
  }

  /**
   * Legacy full-pipeline detector (main thread only). Kept for compatibility.
   */
  public static detectVideo(videoElement: HTMLVideoElement, timestamp: number): FaceAnalysisResult | null {
    const rawPoints = this.detectRawLandmarks(videoElement, timestamp);
    if (!rawPoints) return null;

    const landmarks = TemporalSmoother.smooth(rawPoints);
    const phiMetrics = GeometryEngine.analyze(landmarks) || undefined;
    const qualityMetrics = QualityAssessor.assess(videoElement, landmarks);

    return { landmarks, phiMetrics, qualityMetrics };
  }

  /**
   * Phase 10: Analyzes a static HTMLImageElement.
   * Uses a separate IMAGE-mode FaceLandmarker to avoid breaking the live VIDEO-mode instance.
   */
  public static async detectImage(imageElement: HTMLImageElement): Promise<FaceAnalysisResult | null> {
    // Lazily create a dedicated IMAGE-mode instance
    if (!this.imageInstance) {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      this.imageInstance = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: false,
        runningMode: 'IMAGE', // <-- Static image mode
        numFaces: 1,
      });
    }

    try {
      const result = this.imageInstance.detect(imageElement);

      if (result?.faceLandmarks?.length > 0) {
        const rawPoints: Landmark[] = result.faceLandmarks[0].map((pt: RawLandmark) => ({
          x: pt.x,
          y: pt.y,
          z: pt.z,
          visibility: pt.visibility ?? 1,
        }));

        // No temporal smoothing for static images (single frame)
        const phiMetrics = GeometryEngine.analyze(rawPoints) || undefined;
        const qualityMetrics = QualityAssessor.assessStatic(rawPoints);

        return { landmarks: rawPoints, phiMetrics, qualityMetrics };
      }

      return null; // No face detected
    } catch (e) {
      console.warn('[detectImage] Error:', e);
      return null;
    }
  }
}
