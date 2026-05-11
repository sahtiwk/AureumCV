'use client';
import { useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export default function TelemetryHUD() {
  const { appState } = useAppStore();
  const facialRatioRef = useRef<HTMLSpanElement>(null);
  const eyeSpacingRef = useRef<HTMLSpanElement>(null);
  const symmetryRef = useRef<HTMLSpanElement>(null);
  const phiScoreRef = useRef<HTMLSpanElement>(null);
  
  // Quality refs
  const qualityScoreRef = useRef<HTMLSpanElement>(null);
  const blurRef = useRef<HTMLSpanElement>(null);
  const motionRef = useRef<HTMLSpanElement>(null);

  // Pose refs
  const pitchRef = useRef<HTMLSpanElement>(null);
  const yawRef = useRef<HTMLSpanElement>(null);
  const rollRef = useRef<HTMLSpanElement>(null);
  const poseWarningRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const state = useAppStore.getState();
      
      if (state.appState === 'ANALYZING' && state.currentFaceResult) {
        const metrics = state.currentFaceResult.phiMetrics;
        const quality = state.currentFaceResult.qualityMetrics;
        
        if (metrics) {
          if (facialRatioRef.current) facialRatioRef.current.innerText = metrics.facialRatio.toFixed(3);
          if (eyeSpacingRef.current) eyeSpacingRef.current.innerText = metrics.eyeSpacingRatio.toFixed(3);
          if (symmetryRef.current) symmetryRef.current.innerText = metrics.symmetryScore.toFixed(1) + '%';
          if (phiScoreRef.current) phiScoreRef.current.innerText = metrics.phiScore.toFixed(1) + '%';
        }

        if (quality) {
          if (qualityScoreRef.current) {
            qualityScoreRef.current.innerText = quality.overallScore.toFixed(0) + '/100';
            qualityScoreRef.current.style.color = quality.overallScore > 80 ? '#c9a84c' : '#f87171';
          }
          if (blurRef.current) {
            blurRef.current.innerText = quality.isBlurry ? 'BLURRED' : 'SHARP';
            blurRef.current.className = `text-[10px] font-sans tracking-widest px-2 py-0.5 rounded-sm border ${quality.isBlurry ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-[#c9a84c]/20 text-[#c9a84c] bg-[#c9a84c]/5'}`;
          }
          if (motionRef.current) {
            motionRef.current.innerText = quality.isStable ? 'STABLE' : 'MOVING';
            motionRef.current.className = `text-[10px] font-sans tracking-widest px-2 py-0.5 rounded-sm border ${quality.isStable ? 'border-[#c9a84c]/20 text-[#c9a84c] bg-[#c9a84c]/5' : 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5'}`;
          }

          // Pose updates
          if (pitchRef.current) pitchRef.current.innerText = (quality.pose.pitch >= 0 ? '+' : '') + quality.pose.pitch.toFixed(1) + '°';
          if (yawRef.current) yawRef.current.innerText = (quality.pose.yaw >= 0 ? '+' : '') + quality.pose.yaw.toFixed(1) + '°';
          if (rollRef.current) rollRef.current.innerText = (quality.pose.roll >= 0 ? '+' : '') + quality.pose.roll.toFixed(1) + '°';

          if (poseWarningRef.current) {
            if (!quality.isFrontal) {
              poseWarningRef.current.style.opacity = '1';
              
              let warning = 'Center Head';
              if (quality.pose.pitch > 8) warning = 'Look Up';
              else if (quality.pose.pitch < -8) warning = 'Look Down';
              else if (quality.pose.yaw > 8) warning = 'Turn Right';
              else if (quality.pose.yaw < -8) warning = 'Turn Left';
              else if (quality.pose.roll > 8) warning = 'Tilt Left';
              else if (quality.pose.roll < -8) warning = 'Tilt Right';

              poseWarningRef.current.innerText = warning.toUpperCase();
            } else {
              poseWarningRef.current.style.opacity = '0';
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (appState !== 'ANALYZING') return null;

  return (
    <div className="absolute top-40 left-6 z-30 pointer-events-auto flex flex-col space-y-4 font-sans">
      {/* Geometry Telemetry */}
      <div className="bg-[#0c0a08]/80 backdrop-blur-md border border-[#c9a84c]/20 p-6 rounded-lg shadow-2xl w-72">
        <h2 className="text-[#c9a84c] uppercase tracking-[0.25em] text-[10px] font-medium mb-5 border-b border-[#c9a84c]/10 pb-4">Biometric Stream</h2>
        
        <div className="space-y-5">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#e8d5a3]/40 uppercase tracking-widest">Symmetry</span>
            <span ref={symmetryRef} className="text-2xl font-mono text-[#e8d5a3] tracking-wider">--.-%</span>
          </div>
          
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#e8d5a3]/40 uppercase tracking-widest">Phi Match</span>
            <span ref={phiScoreRef} className="text-2xl font-mono text-[#c9a84c] tracking-wider">--.-%</span>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[#c9a84c]/5">
            <span className="text-[10px] text-[#e8d5a3]/30 uppercase tracking-wider">Portrait Ratio</span>
            <span ref={facialRatioRef} className="text-sm font-mono text-[#e8d5a3]/80 tracking-widest">-.---</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#e8d5a3]/30 uppercase tracking-wider">Ocular Spacing</span>
            <span ref={eyeSpacingRef} className="text-sm font-mono text-[#e8d5a3]/80 tracking-widest">-.---</span>
          </div>
        </div>
      </div>

      {/* 3D Pose Tracker */}
      <div className="bg-[#0c0a08]/80 backdrop-blur-md border border-[#c9a84c]/20 p-5 rounded-lg shadow-xl w-72 relative overflow-hidden">
        <h3 className="text-[10px] text-[#c9a84c]/60 uppercase tracking-[0.2em] font-medium mb-4">Pose Matrix</h3>
        
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col bg-white/5 rounded-sm p-2 border border-white/5">
            <span className="text-[9px] text-[#e8d5a3]/30 uppercase tracking-widest">Pitch</span>
            <span ref={pitchRef} className="text-sm font-mono text-[#e8d5a3] mt-1">0.0°</span>
          </div>
          <div className="flex flex-col bg-white/5 rounded-sm p-2 border border-white/5">
            <span className="text-[9px] text-[#e8d5a3]/30 uppercase tracking-widest">Yaw</span>
            <span ref={yawRef} className="text-sm font-mono text-[#e8d5a3] mt-1">0.0°</span>
          </div>
          <div className="flex flex-col bg-white/5 rounded-sm p-2 border border-white/5">
            <span className="text-[9px] text-[#e8d5a3]/30 uppercase tracking-widest">Roll</span>
            <span ref={rollRef} className="text-sm font-mono text-[#e8d5a3] mt-1">0.0°</span>
          </div>
        </div>

        {/* Dynamic Pose Warning Overlay */}
        <div 
          ref={poseWarningRef}
          className="absolute inset-0 bg-[#7f1d1d]/90 backdrop-blur-sm flex items-center justify-center text-white text-xs font-sans tracking-[0.2em] opacity-0 transition-opacity duration-200 border border-red-500/30"
        >
          CENTER HEAD
        </div>
      </div>

      {/* Quality Validator */}
      <div className="bg-[#0c0a08]/80 backdrop-blur-md border border-[#c9a84c]/20 p-5 rounded-lg shadow-xl w-72">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] text-[#c9a84c]/60 uppercase tracking-[0.2em] font-medium">Capture Integrity</span>
          <span ref={qualityScoreRef} className="text-lg font-mono text-[#e8d5a3]/60 tracking-wider">--/100</span>
        </div>
        
        <div className="flex gap-2">
          <span ref={blurRef} className="text-[10px] font-sans tracking-widest px-2 py-0.5 rounded-sm border border-white/5 bg-white/5 text-[#e8d5a3]/30">WAIT</span>
          <span ref={motionRef} className="text-[10px] font-sans tracking-widest px-2 py-0.5 rounded-sm border border-white/5 bg-white/5 text-[#e8d5a3]/30">WAIT</span>
        </div>
      </div>
    </div>
  );
}

