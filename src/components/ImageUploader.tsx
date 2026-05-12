'use client';
import { useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { FaceLandmarkManager } from '@/ml/FaceLandmarkManager';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageUploader() {
  const { setAppState, setUploadedImage, setCurrentAnalysis, setCurrentFaceResult } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [noFaceError, setNoFaceError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    setNoFaceError(false);
    setIsProcessing(true);
    setAppState('UPLOAD_PROCESSING');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedImage(dataUrl);

      const img = new Image();
      img.src = dataUrl;
      img.onload = async () => {
        try {
          await FaceLandmarkManager.getInstance();
          const result = await FaceLandmarkManager.detectImage(img);

          if (!result) {
            setNoFaceError(true);
            setIsProcessing(false);
            setUploadedImage(null);
            setAppState('UPLOAD_IDLE');
            return;
          }

          setCurrentFaceResult(result);
          setCurrentAnalysis(result);
          setIsProcessing(false);
          setAppState('RESULT');
        } catch (err) {
          console.error('[ImageUploader] Analysis failed:', err);
          setIsProcessing(false);
          setNoFaceError(true);
          setAppState('UPLOAD_IDLE');
        }
      };
    };
    reader.readAsDataURL(file);
  }, [setAppState, setUploadedImage, setCurrentAnalysis, setCurrentFaceResult]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col font-display">
      
      {/* Back Button */}
      <button
        onClick={() => setAppState('IDLE')}
        className="absolute top-4 left-4 md:top-7 md:left-7 flex items-center gap-2 md:gap-3 text-[#e8d5a3]/60 hover:text-[#e8d5a3] transition-colors duration-300 z-10"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        <span className="text-sm tracking-wider font-light">Back</span>
      </button>

      {/* Center Drop Zone */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-16">
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isProcessing && inputRef.current?.click()}
          animate={{
            boxShadow: isDragging
              ? '0 0 60px rgba(201,168,76,0.5), 0 0 120px rgba(201,168,76,0.2), inset 0 0 60px rgba(201,168,76,0.05)'
              : '0 0 40px rgba(201,168,76,0.25), 0 0 80px rgba(201,168,76,0.1), inset 0 0 40px rgba(201,168,76,0.03)',
          }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-2xl cursor-pointer"
          style={{
            border: '1px solid rgba(201,168,76,0.5)',
            borderRadius: '4px',
            background: 'rgba(12,10,8,0.95)',
            minHeight: '260px',
          }}
        >
          {/* Corner accents */}
          {[
            'top-0 left-0 border-t border-l',
            'top-0 right-0 border-t border-r',
            'bottom-0 left-0 border-b border-l',
            'bottom-0 right-0 border-b border-r',
          ].map((pos, i) => (
            <span
              key={i}
              className={`absolute w-4 h-4 ${pos}`}
              style={{ borderColor: '#c9a84c', margin: '-1px' }}
            />
          ))}

          <div className="flex flex-col items-center justify-center py-16 px-8 text-center min-h-[260px]">
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6"
                >
                  {/* Elegant spinner */}
                  <div className="relative w-12 h-12">
                    <div
                      className="absolute inset-0 rounded-full animate-spin"
                      style={{
                        border: '1px solid rgba(201,168,76,0.15)',
                        borderTopColor: '#c9a84c',
                      }}
                    />
                  </div>
                  <span
                    style={{ fontFamily: 'var(--font-display)', color: '#e8d5a3', letterSpacing: '0.15em' }}
                    className="text-sm font-light uppercase tracking-[0.2em]"
                  >
                    Analysing Portrait
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <h2
                    className="text-3xl md:text-5xl font-light"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: isDragging ? '#e8d5a3' : '#d4bc8a',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Upload Portrait
                  </h2>
                  <p
                    className="text-sm font-light"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      color: 'rgba(232,213,163,0.4)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    JPG, PNG, WEBP — any resolution
                  </p>

                  {/* Error message inline */}
                  <AnimatePresence>
                    {noFaceError && (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs mt-2"
                        style={{ color: 'rgba(251,113,133,0.8)', fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}
                      >
                        No face detected — please try a clear, frontal portrait.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="pb-6 md:pb-8 flex items-end justify-between px-4 md:px-7">
        {/* Brand mark */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ border: '1px solid rgba(201,168,76,0.3)' }}
        >
          <span style={{ fontFamily: 'var(--font-display)', color: '#c9a84c', fontSize: '11px', fontWeight: 500 }}>
            S
          </span>
        </div>

        {/* Privacy note */}
        <p
          className="text-xs text-center"
          style={{ fontFamily: 'var(--font-sans)', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}
        >
          Your image never leaves your device. All analysis runs locally in your browser.
        </p>

        {/* Spacer to balance brand mark */}
        <div className="w-8" />
      </footer>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
