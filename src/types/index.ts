export type AppState = 'IDLE' | 'INITIALIZING' | 'MODEL_LOADING' | 'READY' | 'ANALYZING' | 'RESULT' | 'UPLOAD_IDLE' | 'UPLOAD_PROCESSING' | 'ERROR';

export interface Point {
  x: number;
  y: number;
  z: number;
}

export interface Landmark extends Point {
  visibility?: number;
}

export interface PhiMetrics {
  facialRatio: number;
  eyeSpacingRatio: number;
  symmetryScore: number;
  phiScore: number;
}

export interface PoseMetrics {
  pitch: number;
  yaw: number;
  roll: number;
}

export interface QualityMetrics {
  sharpness: number;
  isBlurry: boolean;
  motionStability: number;
  isStable: boolean;
  isOccluded: boolean;
  isWellLit: boolean;
  pose: PoseMetrics;
  isFrontal: boolean;
  overallScore: number;
}

export interface FaceAnalysisResult {
  landmarks: Landmark[];
  phiMetrics?: PhiMetrics;
  qualityMetrics?: QualityMetrics;
}
