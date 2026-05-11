import { Landmark, PhiMetrics } from '@/types';
import { PoseEstimator } from './PoseEstimator';

export class GeometryEngine {
  
  private static getDist(p1: Landmark, p2: Landmark): number {
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) +
      Math.pow(p2.y - p1.y, 2) +
      Math.pow(p2.z - p1.z, 2)
    );
  }

  private static rotatePoint(p: Landmark, pitch: number, yaw: number, roll: number): Landmark {
    const pR = pitch * (Math.PI / 180);
    const yR = yaw * (Math.PI / 180);
    const rR = roll * (Math.PI / 180);

    const y1 = p.y * Math.cos(pR) - p.z * Math.sin(pR);
    const z1 = p.y * Math.sin(pR) + p.z * Math.cos(pR);
    const x1 = p.x;

    const x2 = x1 * Math.cos(yR) + z1 * Math.sin(yR);
    const z2 = -x1 * Math.sin(yR) + z1 * Math.cos(yR);
    const y2 = y1;

    const x3 = x2 * Math.cos(rR) - y2 * Math.sin(rR);
    const y3 = x2 * Math.sin(rR) + y2 * Math.cos(rR);
    const z3 = z2;

    return { x: x3, y: y3, z: z3, visibility: p.visibility };
  }

  public static normalizeLandmarks(landmarks: Landmark[], pitch: number, yaw: number, roll: number): Landmark[] {
    const nose = landmarks[1];
    const invPitch = -pitch;
    const invYaw = -yaw;
    const invRoll = -roll;

    const rotated = landmarks.map(p => {
      const translated = { x: p.x - nose.x, y: p.y - nose.y, z: p.z - nose.z, visibility: p.visibility };
      return this.rotatePoint(translated, invPitch, invYaw, invRoll);
    });

    const faceWidth = this.getDist(rotated[234], rotated[454]);
    const scaleFactor = faceWidth > 0 ? 1.0 / faceWidth : 1;

    return rotated.map(p => ({
      x: p.x * scaleFactor,
      y: p.y * scaleFactor,
      z: p.z * scaleFactor,
      visibility: p.visibility
    }));
  }

  public static analyze(landmarks: Landmark[]): PhiMetrics | null {
    if (landmarks.length !== 478) return null;

    // 1. Calculate Pose
    const pose = PoseEstimator.estimate(landmarks);

    // 2. Canonical Normalization
    const canonicalPts = this.normalizeLandmarks(landmarks, pose.pitch, pose.yaw, pose.roll);

    // Facial Ratio (Height to Width)
    const h = this.getDist(canonicalPts[10], canonicalPts[152]);
    const w = this.getDist(canonicalPts[234], canonicalPts[454]);
    const facialRatio = w > 0 ? h / w : 0;

    // Eye Spacing Ratio
    const leftEyeW = this.getDist(canonicalPts[33], canonicalPts[133]);
    const rightEyeW = this.getDist(canonicalPts[263], canonicalPts[362]);
    const interEyeDist = this.getDist(canonicalPts[133], canonicalPts[362]);
    const eyeSpacingRatio = (leftEyeW + rightEyeW) > 0 ? interEyeDist / ((leftEyeW + rightEyeW) / 2) : 0;

    // Symmetry Score
    const distLeft = this.getDist(canonicalPts[1], canonicalPts[234]);
    const distRight = this.getDist(canonicalPts[1], canonicalPts[454]);
    
    const diff = Math.abs(distLeft - distRight);
    const maxDist = Math.max(distLeft, distRight);
    let symmetryScore = 100.0;
    if (maxDist > 0) {
      symmetryScore = 100.0 * (1.0 - (diff / maxDist));
    }

    // Phi Score (Golden Ratio deviation)
    const phiIdeal = 1.618;
    const phiDeviation = Math.abs(facialRatio - phiIdeal);
    const phiScore = 100.0 * Math.max(0.0, 1.0 - (phiDeviation / phiIdeal));

    return {
      facialRatio,
      eyeSpacingRatio,
      symmetryScore,
      phiScore
    };
  }
}
