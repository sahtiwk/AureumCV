'use client';
import { useState, useEffect } from 'react';
import WebcamPreview from './WebcamPreview';
import CanvasOverlay from './CanvasOverlay';
import TelemetryHUD from './TelemetryHUD';
import TargetingReticle from './TargetingReticle';
import ResultView from './ResultView';
import ImageUploader from './ImageUploader';
import TargetCursor from './TargetCursor';
import DotField from './DotField';
import LandingCards from './LandingCards';
import { useAppStore } from '@/store/useAppStore';
import { Camera, ScanFace, Activity, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MainInterface() {
  const { isWebcamActive, setWebcamActive, appState, setAppState, error, analysisMode, setAnalysisMode } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isUploadMode = appState === 'UPLOAD_IDLE' || appState === 'UPLOAD_PROCESSING';

  return (
    <main className={`relative w-screen bg-[#0a0908] font-sans ${appState === 'IDLE' ? 'min-h-screen overflow-y-auto overflow-x-hidden' : 'h-screen overflow-hidden'}`}>
      {appState === 'IDLE' && (
        <TargetCursor 
          spinDuration={2}
          hideDefaultCursor
          parallaxOn
          hoverDuration={0.2}
        />
      )}
      {/* Background DotField (Landing & Upload modes only) */}
      {(appState === 'IDLE' || isUploadMode) && (
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
          <DotField 
            dotSpacing={14} 
            dotRadius={1.5} 
            bulgeStrength={80}
            glowRadius={300}
            gradientFrom="rgba(201, 168, 76, 0.6)"
            gradientTo="rgba(232, 213, 163, 0.2)"
          />
        </div>
      )}

      {/* Layer routing */}
      {appState === 'RESULT' ? (
        <ResultView />
      ) : isUploadMode ? (
        <ImageUploader />
      ) : (
        <>
          <WebcamPreview />
          <CanvasOverlay />
          <TelemetryHUD />
          {analysisMode === 'SNAPSHOT' && <TargetingReticle />}
        </>
      )}

      {/* UI Overlay (hidden in result/upload modes) */}
      <div className={`absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 ${(appState === 'RESULT' || isUploadMode) ? 'hidden' : ''}`}>
        
        {/* Header */}
        <header className="flex justify-between items-center w-full px-4 pt-4">
          <button 
            onClick={() => {
              setWebcamActive(false);
              setAppState('IDLE');
            }}
            className="flex items-center space-x-5 pointer-events-auto bg-[#0c0a08]/60 backdrop-blur-md p-3 pr-8 rounded-lg border border-[#c9a84c]/20 shadow-2xl relative overflow-hidden group transition-all duration-300 hover:border-[#c9a84c]/50 hover:bg-[#0c0a08]/80 cursor-pointer"
          >
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />
            <div className="w-12 h-12 rounded-full border border-[#c9a84c]/40 flex items-center justify-center shadow-[0_0_20px_rgba(201,168,76,0.1)] group-hover:scale-110 group-hover:border-[#c9a84c] transition-all duration-500">
              <ScanFace className="text-[#c9a84c] w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-[#e8d5a3] font-display text-2xl tracking-wide leading-tight transition-colors group-hover:text-white">AureumCV</h1>
              <p className="text-[9px] text-[#c9a84c]/50 uppercase tracking-[0.25em] font-sans group-hover:text-[#c9a84c]/80">Biometric Geometry</p>
            </div>
          </button>

          {/* Status Badge */}
          <div className="flex items-center space-x-3 bg-[#0c0a08]/80 backdrop-blur-md px-6 py-3 rounded-full border border-[#c9a84c]/10 shadow-xl">
            <span className="relative flex h-2 w-2">
              {isWebcamActive && appState !== 'MODEL_LOADING' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a84c] opacity-40"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c9a84c]"></span>
                </>
              ) : isWebcamActive && appState === 'MODEL_LOADING' ? (
                <>
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-[#e8d5a3] opacity-40"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e8d5a3]"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-800"></span>
              )}
            </span>
            <span className="text-[10px] font-sans font-medium text-[#e8d5a3]/50 tracking-[0.2em] uppercase">
              {appState === 'IDLE' ? 'System Idle' :
               appState === 'MODEL_LOADING' ? 'Initialising AI...' :
               appState === 'READY' ? 'Ready' :
               appState === 'ANALYZING' ? 'Analysing' :
               appState === 'ERROR' ? 'System Error' : 'Ready'}
            </span>
          </div>
        </header>

        {/* Error State */}
        {error && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-red-500/20 backdrop-blur-xl border border-red-500/50 text-red-100 px-6 py-3 rounded-2xl shadow-2xl shadow-red-500/20 max-w-md text-center">
            {error}
          </div>
        )}

        {/* ── IDLE: Two-card Mode Selector ── */}
        {appState === 'IDLE' && (
          <>
            {/* ── Hero Section (viewport-height) ── */}
            <div className="relative min-h-screen flex flex-col items-center justify-center gap-10 pointer-events-auto px-6">
              <div className="text-center space-y-4 mb-2">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-7xl font-light tracking-tight text-[#e8d5a3] font-display"
                >
                  AureumCV
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-[#e8d5a3]/40 text-lg max-w-md font-sans tracking-wide mx-auto"
                >
                  Advanced Facial Geometry & Phi Analysis
                </motion.p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 w-full max-w-3xl">
                {/* Live Camera Card */}
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ y: -5, boxShadow: '0 0 40px rgba(201,168,76,0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setWebcamActive(true)}
                  className="flex-1 group relative bg-[#0c0a08] border border-[#c9a84c]/20 hover:border-[#c9a84c]/50 rounded-lg p-10 flex flex-col items-center gap-6 transition-all duration-500 overflow-hidden cursor-target"
                >
                  {/* Corner accents */}
                  <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#c9a84c]/40 m-2" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#c9a84c]/40 m-2" />
                  
                  <div className="w-14 h-14 rounded-full border border-[#c9a84c]/30 flex items-center justify-center group-hover:scale-110 group-hover:border-[#c9a84c] transition-all duration-500">
                    <Camera className="w-6 h-6 text-[#c9a84c]" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-[#e8d5a3] font-display text-2xl mb-2 tracking-wide">Live Stream</h3>
                    <p className="text-[#e8d5a3]/30 text-sm font-sans leading-relaxed">
                      Real-time 3D tracking with dynamic Phi metrics and gesture guidance.
                    </p>
                  </div>
                  <div className="mt-auto pt-6">
                    <span className="text-[10px] font-sans text-[#c9a84c] uppercase tracking-[0.25em] opacity-60 group-hover:opacity-100 transition-opacity">
                      Access Camera
                    </span>
                  </div>
                </motion.button>

                {/* Upload Photo Card */}
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -5, boxShadow: '0 0 40px rgba(201,168,76,0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAppState('UPLOAD_IDLE')}
                  className="flex-1 group relative bg-[#0c0a08] border border-[#c9a84c]/20 hover:border-[#c9a84c]/50 rounded-lg p-10 flex flex-col items-center gap-6 transition-all duration-500 overflow-hidden cursor-target"
                >
                  {/* Corner accents */}
                  <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#c9a84c]/40 m-2" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#c9a84c]/40 m-2" />

                  <div className="w-14 h-14 rounded-full border border-[#c9a84c]/30 flex items-center justify-center group-hover:scale-110 group-hover:border-[#c9a84c] transition-all duration-500">
                    <Upload className="w-6 h-6 text-[#c9a84c]" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-[#e8d5a3] font-display text-2xl mb-2 tracking-wide">Static Analysis</h3>
                    <p className="text-[#e8d5a3]/30 text-sm font-sans leading-relaxed">
                      High-fidelity proportional analysis from uploaded portrait photography.
                    </p>
                  </div>
                  <div className="mt-auto pt-6">
                    <span className="text-[10px] font-sans text-[#c9a84c] uppercase tracking-[0.25em] opacity-60 group-hover:opacity-100 transition-opacity">
                      Upload Portrait
                    </span>
                  </div>
                </motion.button>
              </div>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[#e8d5a3]/20 text-[10px] uppercase tracking-[0.2em] font-sans"
              >
                All processing is local · Privacy First
              </motion.p>

              {/* Scroll-down indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
              >
                <span className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#c9a84c]/30">Scroll to learn more</span>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="w-5 h-8 rounded-full border border-[#c9a84c]/20 flex items-start justify-center pt-1.5"
                >
                  <div className="w-1 h-1.5 rounded-full bg-[#c9a84c]/50" />
                </motion.div>
              </motion.div>
            </div>

            {/* ── Educational Cards Section ── */}
            <LandingCards />
          </>
        )}

        {/* Footer Controls (live tracking only) */}
        <footer className="w-full flex justify-center items-center pointer-events-auto pb-10 space-x-8">
          {/* Free Track / Snapshot toggle */}
          {isWebcamActive && appState === 'ANALYZING' && (
            <div className="flex bg-[#0c0a08]/80 backdrop-blur-md border border-[#c9a84c]/20 p-1.5 rounded-full shadow-2xl">
              <button
                onClick={() => setAnalysisMode('FREE_TRACK')}
                className={`px-8 py-2 rounded-full text-[10px] font-sans font-medium uppercase tracking-[0.2em] transition-all duration-500 cursor-target ${analysisMode === 'FREE_TRACK' ? 'bg-[#c9a84c] text-black shadow-lg' : 'text-[#e8d5a3]/40 hover:text-[#e8d5a3]'}`}
              >
                Stream
              </button>
              <button
                onClick={() => setAnalysisMode('SNAPSHOT')}
                className={`px-8 py-2 rounded-full text-[10px] font-sans font-medium uppercase tracking-[0.2em] transition-all duration-500 cursor-target ${analysisMode === 'SNAPSHOT' ? 'bg-[#c9a84c] text-black shadow-lg' : 'text-[#e8d5a3]/40 hover:text-[#e8d5a3]'}`}
              >
                Snapshot
              </button>
            </div>
          )}

          {/* Camera on/off button */}
          {appState !== 'IDLE' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setWebcamActive(!isWebcamActive)}
              className={`
                relative group flex items-center space-x-3 px-10 py-4 rounded-full font-sans text-[10px] uppercase tracking-[0.25em] font-medium transition-all duration-500 shadow-2xl overflow-hidden cursor-target
                ${isWebcamActive
                  ? 'bg-red-950/20 text-red-400 border border-red-500/30 hover:bg-red-500/10'
                  : 'bg-[#e8d5a3] text-black hover:bg-white'}
              `}
            >
              {isWebcamActive ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>Terminate</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Initialise</span>
                </>
              )}
            </motion.button>
          )}
        </footer>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] mix-blend-multiply"></div>
    </main>
  );
}
