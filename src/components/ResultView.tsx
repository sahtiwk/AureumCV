'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { RefreshCcw, FileDown, CheckCircle2, Loader2 } from 'lucide-react';
import { generateReport } from '@/utils/ReportGenerator';

export default function ResultView() {
  const { snapshotImage, uploadedImage, currentAnalysis, setAppState, setSnapshotImage, setUploadedImage } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);

  const displayImage = snapshotImage || uploadedImage;
  const analysisSource: 'camera' | 'upload' = snapshotImage ? 'camera' : 'upload';

  const resetScanner = () => {
    setSnapshotImage(null);
    setUploadedImage(null);
    setAppState(uploadedImage ? 'UPLOAD_IDLE' : 'ANALYZING');
  };

  const handleExport = async () => {
    if (!displayImage || !currentAnalysis || isExporting) return;
    setIsExporting(true);
    try {
      const png = await generateReport({ displayImage, analysisSource, result: currentAnalysis });
      const link = document.createElement('a');
      link.download = `aureumcv-report-${Date.now()}.png`;
      link.href = png;
      link.click();
    } catch (e) {
      console.error('[ReportGenerator] Failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  if (!displayImage || !currentAnalysis) return null;
  const metrics = currentAnalysis.phiMetrics;
  if (!metrics) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] font-sans pointer-events-auto overflow-y-auto">
      <motion.img initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 0.15 }} transition={{ duration: 2 }} src={displayImage} alt="Captured Face" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.9)_100%)] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[calc(100%-2rem)] md:max-w-xl bg-[#0c0a08]/90 backdrop-blur-3xl border border-[#c9a84c]/20 p-6 md:p-12 rounded-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden my-4 md:my-0"
      >
        <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#c9a84c]/50 m-4" />
        <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#c9a84c]/50 m-4" />

        <div className="text-center mb-8 md:mb-12 relative">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
            className="w-12 h-12 md:w-16 md:h-16 mx-auto border border-[#c9a84c]/30 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-[0_0_30px_rgba(201,168,76,0.1)]">
            <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-[#c9a84c]" />
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-light text-[#e8d5a3] font-display tracking-tight mb-2 md:mb-3">Analysis Complete</h2>
          <p className="text-[#e8d5a3]/30 font-sans text-xs md:text-sm uppercase tracking-[0.2em]">Geometric Harmony Computed</p>
        </div>

        <div className="flex flex-col items-center justify-center mb-8 md:mb-12 py-6 md:py-10 border-y border-[#c9a84c]/10 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.05)_0%,transparent_70%)] pointer-events-none" />
          <span className="text-[#c9a84c]/60 font-sans text-[10px] tracking-[0.3em] uppercase mb-3 md:mb-4">Golden Ratio Match</span>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1 }}
            className="text-5xl md:text-8xl font-mono text-[#e8d5a3] tracking-tighter">
            {metrics.phiScore.toFixed(1)}<span className="text-xl md:text-3xl font-display text-[#c9a84c]/40 ml-1">%</span>
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-14">
          <div className="flex flex-col items-center">
            <span className="text-[#e8d5a3]/30 text-[8px] md:text-[9px] uppercase tracking-[0.25em] mb-2 md:mb-3">Symmetry</span>
            <span className="text-lg md:text-2xl font-mono text-[#e8d5a3]">{metrics.symmetryScore.toFixed(1)}%</span>
          </div>
          <div className="flex flex-col items-center border-x border-[#c9a84c]/10 px-2 md:px-4">
            <span className="text-[#e8d5a3]/30 text-[8px] md:text-[9px] uppercase tracking-[0.25em] mb-2 md:mb-3">Portrait</span>
            <span className="text-lg md:text-2xl font-mono text-[#e8d5a3]">{metrics.facialRatio.toFixed(3)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[#e8d5a3]/30 text-[8px] md:text-[9px] uppercase tracking-[0.25em] mb-2 md:mb-3">Ocular</span>
            <span className="text-lg md:text-2xl font-mono text-[#e8d5a3]">{metrics.eyeSpacingRatio.toFixed(3)}</span>
          </div>
        </div>

        <div className="flex gap-3 md:gap-4">
          <button onClick={resetScanner}
            className="flex-1 group flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 bg-white/5 hover:bg-white/10 text-[#e8d5a3]/70 hover:text-[#e8d5a3] border border-white/5 hover:border-[#c9a84c]/30 rounded-sm font-sans text-xs uppercase tracking-[0.2em] transition-all duration-500">
            <RefreshCcw className="w-4 h-4 group-hover:-rotate-90 transition-transform duration-700" />
            <span>Reset</span>
          </button>
          <button onClick={handleExport} disabled={isExporting}
            className="flex-1 group flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 disabled:opacity-40 text-[#c9a84c] border border-[#c9a84c]/30 hover:border-[#c9a84c] rounded-sm font-sans text-xs uppercase tracking-[0.2em] transition-all duration-500 shadow-[0_0_30px_rgba(201,168,76,0.1)]">
            {isExporting ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Exporting...</span></>) : (<><FileDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" /><span>Report</span></>)}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
