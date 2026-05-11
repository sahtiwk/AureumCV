import { Landmark, QualityMetrics } from '@/types';
import { PoseEstimator } from '../geometry/PoseEstimator';

export class QualityAssessor {
  private static lastLandmarks: Landmark[] | null = null;
  private static canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private static ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;
  
  private static lastSharpnessCheckTime = 0;
  private static SHARPNESS_INTERVAL_MS = 250; // Throttle to 4 FPS
  
  private static cachedSharpness = 100;
  private static cachedIsBlurry = false;
  private static cachedBrightness = 128;
  private static cachedIsWellLit = true;

  private static checkSharpnessAndLighting(image: ImageBitmap | HTMLVideoElement): { sharpness: number; isBlurry: boolean; isWellLit: boolean } {
    const now = performance.now();
    if (now - this.lastSharpnessCheckTime < this.SHARPNESS_INTERVAL_MS) {
      return { sharpness: this.cachedSharpness, isBlurry: this.cachedIsBlurry, isWellLit: this.cachedIsWellLit };
    }

    if (!this.canvas) {
      if (typeof OffscreenCanvas !== 'undefined') {
        this.canvas = new OffscreenCanvas(150, 150);
      } else {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 150;
        this.canvas.height = 150;
      }
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
    }

    const ctx = this.ctx;
    if (!ctx) return { sharpness: this.cachedSharpness, isBlurry: this.cachedIsBlurry, isWellLit: this.cachedIsWellLit };

    try {
      ctx.drawImage(image, 0, 0, 150, 150);
      const imageData = ctx.getImageData(0, 0, 150, 150);
      const data = imageData.data;

      const gray = new Float32Array(150 * 150);
      let brightnessSum = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        gray[i / 4] = luminance;
        brightnessSum += luminance;
      }

      const avgBrightness = brightnessSum / (150 * 150);
      this.cachedBrightness = avgBrightness;
      // If brightness is too low (e.g. < 40) or too high (e.g. > 240)
      this.cachedIsWellLit = avgBrightness > 40 && avgBrightness < 240;

      let laplacianSum = 0;
      let laplacianSqSum = 0;
      let laplacianCount = 0;

      for (let y = 1; y < 149; y++) {
        for (let x = 1; x < 149; x++) {
          const idx = y * 150 + x;
          const val =
            gray[idx - 150] +
            gray[idx - 1] +
            gray[idx + 1] +
            gray[idx + 150] -
            4 * gray[idx];

          laplacianSum += val;
          laplacianSqSum += val * val;
          laplacianCount++;
        }
      }

      const laplacianMean = laplacianSum / laplacianCount;
      const laplacianVariance = (laplacianSqSum / laplacianCount) - (laplacianMean * laplacianMean);

      this.cachedSharpness = laplacianVariance;
      this.cachedIsBlurry = laplacianVariance < 40; 
      this.lastSharpnessCheckTime = now;
    } catch (e) {}

    return { sharpness: this.cachedSharpness, isBlurry: this.cachedIsBlurry, isWellLit: this.cachedIsWellLit };
  }

  private static checkMotion(landmarks: Landmark[]): { stability: number; isStable: boolean } {
    if (!this.lastLandmarks) {
      this.lastLandmarks = landmarks;
      return { stability: 100, isStable: true };
    }

    const anchors = [1, 33, 263, 152];
    let totalDelta = 0;

    for (const idx of anchors) {
      const p1 = this.lastLandmarks[idx];
      const p2 = landmarks[idx];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      totalDelta += Math.hypot(dx, dy);
    }

    const avgDelta = totalDelta / anchors.length;
    const stabilityScore = Math.max(0, 100 - (avgDelta * 3000));
    
    this.lastLandmarks = landmarks;

    return { 
      stability: stabilityScore, 
      isStable: stabilityScore > 75 
    };
  }

  private static checkOcclusion(landmarks: Landmark[]): boolean {
    const edgeMargin = 0.02; 
    for (let i = 0; i < landmarks.length; i += 10) { 
      const pt = landmarks[i];
      if (pt.x < edgeMargin || pt.x > 1 - edgeMargin || pt.y < edgeMargin || pt.y > 1 - edgeMargin) {
        return true;
      }
    }
    return false;
  }

  public static assess(image: ImageBitmap | HTMLVideoElement, landmarks: Landmark[]): QualityMetrics {
    const { sharpness, isBlurry, isWellLit } = this.checkSharpnessAndLighting(image);
    const { stability, isStable } = this.checkMotion(landmarks);
    const isOccluded = this.checkOcclusion(landmarks);
    
    // Pose validation
    const pose = PoseEstimator.estimate(landmarks);
    const isFrontal = Math.abs(pose.pitch) < 8 && Math.abs(pose.yaw) < 8 && Math.abs(pose.roll) < 8;

    let overallScore = 100;
    if (isBlurry) overallScore -= 40;
    if (!isWellLit) overallScore -= 30;
    if (!isStable) overallScore -= (100 - stability);
    if (isOccluded) overallScore -= 50;
    if (!isFrontal) {
      const maxAngle = Math.max(Math.abs(pose.pitch), Math.abs(pose.yaw), Math.abs(pose.roll));
      overallScore -= Math.min(40, maxAngle * 2);
    }

    overallScore = Math.max(0, overallScore);

    return {
      sharpness,
      isBlurry,
      motionStability: stability,
      isStable,
      isOccluded,
      isWellLit,
      pose,
      isFrontal,
      overallScore
    };
  }

  /**
   * Static image quality assessment.
   * Skips motion stability and lighting — only scores frontal alignment and face visibility.
   */
  public static assessStatic(landmarks: Landmark[]): QualityMetrics {
    const isOccluded = this.checkOcclusion(landmarks);
    const pose = PoseEstimator.estimate(landmarks);
    const isFrontal = Math.abs(pose.pitch) < 10 && Math.abs(pose.yaw) < 10 && Math.abs(pose.roll) < 10;

    let overallScore = 100;
    if (isOccluded) overallScore -= 50;
    if (!isFrontal) {
      const maxAngle = Math.max(Math.abs(pose.pitch), Math.abs(pose.yaw), Math.abs(pose.roll));
      overallScore -= Math.min(40, maxAngle * 2);
    }
    overallScore = Math.max(0, overallScore);

    return {
      sharpness: 100,       // Not measured for static images
      isBlurry: false,
      motionStability: 100, // N/A for static images
      isStable: true,
      isOccluded,
      isWellLit: true,      // Not measured for static images
      pose,
      isFrontal,
      overallScore,
    };
  }
}

