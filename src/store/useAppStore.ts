import { create } from 'zustand';
import { AppState, FaceAnalysisResult } from '@/types';

interface AppStoreState {
  appState: AppState;
  analysisMode: 'FREE_TRACK' | 'SNAPSHOT';
  isWebcamActive: boolean;
  currentAnalysis: FaceAnalysisResult | null; // Final frozen result
  currentFaceResult: FaceAnalysisResult | null; // High-frequency transient state
  snapshotImage: string | null; // Base64 snapshot (camera)
  uploadedImage: string | null; // Base64 uploaded image (static mode)
  captureCountdown: number | null; // 3, 2, 1
  error: string | null;
  
  // Actions
  setAppState: (state: AppState) => void;
  setAnalysisMode: (mode: 'FREE_TRACK' | 'SNAPSHOT') => void;
  setWebcamActive: (isActive: boolean) => void;
  setCurrentAnalysis: (analysis: FaceAnalysisResult | null) => void;
  setCurrentFaceResult: (result: FaceAnalysisResult | null) => void;
  setSnapshotImage: (image: string | null) => void;
  setUploadedImage: (image: string | null) => void;
  setCaptureCountdown: (countdown: number | null) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  appState: 'IDLE',
  analysisMode: 'FREE_TRACK',
  isWebcamActive: false,
  currentAnalysis: null,
  currentFaceResult: null,
  snapshotImage: null,
  uploadedImage: null,
  captureCountdown: null,
  error: null,

  setAppState: (state) => set({ appState: state }),
  setAnalysisMode: (mode) => set({ analysisMode: mode }),
  setWebcamActive: (isActive) => set({ isWebcamActive: isActive }),
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setCurrentFaceResult: (result) => set({ currentFaceResult: result }),
  setSnapshotImage: (image) => set({ snapshotImage: image }),
  setUploadedImage: (image) => set({ uploadedImage: image }),
  setCaptureCountdown: (countdown) => set({ captureCountdown: countdown }),
  setError: (error) => set({ error, appState: error ? 'ERROR' : 'IDLE' }),
}));

