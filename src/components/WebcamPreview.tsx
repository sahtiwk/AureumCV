'use client';
import { useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { FaceLandmarkManager } from '@/ml/FaceLandmarkManager';

export default function WebcamPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const { isWebcamActive, setAppState, setError, setCurrentFaceResult } = useAppStore();

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isActive = true;

    const startTrackingLoop = async () => {
      try {
        setAppState('MODEL_LOADING');
        await FaceLandmarkManager.getInstance();
        if (!isActive) return;
        setAppState('READY');

        const predictWebcam = () => {
          const video = videoRef.current;
          if (
            video &&
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            video.currentTime !== lastVideoTimeRef.current
          ) {
            lastVideoTimeRef.current = video.currentTime;

            const startTimeMs = performance.now();
            const result = FaceLandmarkManager.detectVideo(video, startTimeMs);

            if (result) {
              setCurrentFaceResult(result);
              if (useAppStore.getState().appState !== 'ANALYZING') {
                setAppState('ANALYZING');
              }
            } else {
              setCurrentFaceResult(null);
            }
          }
          if (isActive) {
            requestRef.current = requestAnimationFrame(predictWebcam);
          }
        };

        requestRef.current = requestAnimationFrame(predictWebcam);
      } catch (err) {
        console.error('Error loading model:', err);
        setError('Failed to load Face Landmarker model.');
      }
    };

    if (isWebcamActive && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'user',
          },
        })
        .then((stream) => {
          if (!isActive) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            activeStream = stream;
            videoRef.current.onloadedmetadata = () => {
              startTrackingLoop();
            };
          }
        })
        .catch((err) => {
          console.error('Error accessing webcam:', err);
          setError('Failed to access webcam. Please check permissions.');
        });
    } else if (!isWebcamActive) {
      isActive = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      setCurrentFaceResult(null);
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
      }
      setAppState('IDLE');
    }

    return () => {
      isActive = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isWebcamActive, setAppState, setError, setCurrentFaceResult]);

  if (!isWebcamActive) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="absolute top-0 left-0 w-full h-full object-cover -scale-x-100 z-0"
    />
  );
}
