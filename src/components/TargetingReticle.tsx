'use client';
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

export default function TargetingReticle() {
  const { appState } = useAppStore();
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const reticleRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (countdown === 0) {
      const video = document.querySelector('video');
      if (!video) return;

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Mirror the image since webcam is mirrored
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const snapshotUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      const state = useAppStore.getState();
      state.setCurrentAnalysis(state.currentFaceResult); // Freeze the exact metrics
      state.setSnapshotImage(snapshotUrl);
      state.setAppState('RESULT');

      setCountdown(null);
    }
  }, [countdown]);

  useEffect(() => {
    if (appState !== 'ANALYZING') {
      setCountdown(null);
      return;
    }

    const checkInterval = setInterval(() => {
      const state = useAppStore.getState();
      const score = state.currentFaceResult?.qualityMetrics?.overallScore || 0;

      if (score > 90) {
        setCountdown(prev => (prev === null ? 3 : Math.max(0, prev - 1)));
      } else {
        setCountdown(null);
      }
    }, 1000);

    let animationFrameId: number;
    const render = () => {
      const state = useAppStore.getState();
      const quality = state.currentFaceResult?.qualityMetrics;

      if (quality) {
        let message = 'Align Face';
        if (!quality.isWellLit) message = 'Too Dark - Improve Lighting';
        else if (quality.isBlurry) message = 'Hold Still - Blurry';
        else if (!quality.isStable) message = 'Hold Still';
        else if (!quality.isFrontal) {
          if (quality.pose.pitch > 8) message = 'Look Up';
          else if (quality.pose.pitch < -8) message = 'Look Down';
          else if (quality.pose.yaw > 8) message = 'Turn Right';
          else if (quality.pose.yaw < -8) message = 'Turn Left';
          else if (quality.pose.roll > 8) message = 'Tilt Left';
          else if (quality.pose.roll < -8) message = 'Tilt Right';
          else message = 'Center Head';
        } else if (quality.overallScore > 90) {
          message = 'Perfect - Hold Still';
        }

        if (messageRef.current && messageRef.current.innerText !== message) {
            messageRef.current.innerText = message;
        }

        const isPerfect = quality.overallScore > 90;
        
        if (reticleRef.current) {
          if (isPerfect) {
            reticleRef.current.className = "relative w-64 h-64 rounded-full border-2 transition-all duration-300 flex items-center justify-center border-[#c9a84c] scale-110 shadow-[0_0_50px_rgba(201,168,76,0.3)]";
          } else {
            reticleRef.current.className = "relative w-64 h-64 rounded-full border-2 transition-all duration-300 flex items-center justify-center border-white/10";
          }
        }

        if (badgeRef.current) {
          if (isPerfect) {
            badgeRef.current.className = "mt-8 px-8 py-3 rounded-full backdrop-blur-md shadow-xl transition-all bg-[#c9a84c]/20 text-[#e8d5a3] border border-[#c9a84c]/50";
          } else {
            badgeRef.current.className = "mt-8 px-8 py-3 rounded-full backdrop-blur-md shadow-xl transition-all bg-[#0c0a08]/60 text-[#e8d5a3]/40 border border-[#c9a84c]/10";
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      clearInterval(checkInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, [appState]);

  if (appState !== 'ANALYZING') return null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center">
      {/* Reticle Circle */}
      <div ref={reticleRef} className="relative w-64 h-64 rounded-full border-2 transition-all duration-300 flex items-center justify-center border-white/10">
        
        {/* Countdown Number */}
        {countdown !== null && (
          <span className="text-8xl font-mono text-[#e8d5a3] drop-shadow-[0_0_30px_rgba(201,168,76,0.5)] animate-pulse">
            {countdown}
          </span>
        )}
        
        {/* Crosshairs */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#c9a84c]/10" />
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-[#c9a84c]/10" />
      </div>

      {/* Instruction Badge */}
      <div ref={badgeRef} className="mt-8 px-8 py-3 rounded-full backdrop-blur-md border border-[#c9a84c]/10 shadow-xl transition-all bg-[#0c0a08]/60 text-[#e8d5a3]/40">
        <span ref={messageRef} className="font-sans text-[10px] font-medium tracking-[0.25em] uppercase whitespace-nowrap">Align Face</span>
      </div>
    </div>
  );
}

