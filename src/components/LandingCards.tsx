'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Ratio, Eye, Box, Sparkles } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/* ── small reusable bits ─────────────────────────────── */

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 w-full max-w-7xl mx-auto">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />
      <span className="text-[10px] font-sans uppercase tracking-[0.3em] text-[#c9a84c]/40">
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />
    </div>
  );
}

function CornerAccents() {
  return (
    <>
      <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#c9a84c]/30 m-3 pointer-events-none" />
      <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#c9a84c]/30 m-3 pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#c9a84c]/30 m-3 pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#c9a84c]/30 m-3 pointer-events-none" />
    </>
  );
}

/* ── main component ──────────────────────────────────── */

export default function LandingCards() {
  return (
    <section className="relative w-full bg-[#0a0908] pb-32">
      {/* Gradient transition from hero */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a0908] to-transparent z-10 pointer-events-none" />

      <div className="relative z-20 flex flex-col items-center gap-24 px-6 md:px-12 lg:px-20 pt-16">

        {/* ─── Scroll hint ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-px h-16 bg-gradient-to-b from-[#c9a84c]/50 to-transparent" />
          <span className="text-[10px] font-sans uppercase tracking-[0.3em] text-[#c9a84c]/40">
            Discover the Science
          </span>
        </motion.div>

        {/* ══════════════════════════════════════════════
            CARD 1 — What is Phi (Φ) & The Golden Ratio
           ══════════════════════════════════════════════ */}
        <SectionDivider label="Geometric Proportions" />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          custom={0}
          className="relative w-full max-w-7xl rounded-2xl border border-[#c9a84c]/15 bg-[#0c0a08]/80 backdrop-blur-xl shadow-[0_0_80px_rgba(201,168,76,0.05)] overflow-hidden"
        >
          <CornerAccents />

          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent" />

          <div className="grid md:grid-cols-[5fr_7fr] gap-0">
            {/* Text side */}
            <div className="p-10 md:p-14 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full border border-[#c9a84c]/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#c9a84c]" />
                </div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#c9a84c]/60">
                  Foundation
                </span>
              </div>

              <h3 className="text-4xl md:text-5xl font-display font-light text-[#e8d5a3] mb-2 tracking-wide">
                What is <span className="italic text-[#c9a84c]">Phi</span> (Φ)?
              </h3>
              <p className="text-[#e8d5a3]/40 text-base font-sans leading-relaxed mb-6">
                Phi (Φ ≈ 1.618034…) is an irrational number discovered by the ancient Greeks, often called
                the <strong className="text-[#e8d5a3]/70">Divine Proportion</strong>. It appears when a line is
                divided so the ratio of the whole to the larger part equals the ratio of the larger part to the
                smaller&nbsp;part.
              </p>

              <div className="bg-[#0a0908] border border-[#c9a84c]/10 rounded-lg px-6 py-4 mb-6">
                <p className="font-mono text-[#c9a84c] text-lg tracking-wide text-center">
                  (a + b) / a = a / b = Φ ≈ 1.618
                </p>
              </div>

              <h4 className="text-2xl font-display font-light text-[#e8d5a3] mb-3 tracking-wide">
                The Golden Ratio
              </h4>
              <p className="text-[#e8d5a3]/40 text-sm font-sans leading-relaxed">
                When Phi governs the proportions of a rectangle, spiral, or any geometric form, the result is
                called the <strong className="text-[#e8d5a3]/70">Golden Ratio</strong>. In the context of facial
                analysis, AureumCV measures how closely key facial landmarks conform to these ideal
                proportions — from the width-to-height ratio of the face to the spacing between features.
              </p>
            </div>

            {/* Image side */}
            <div className="relative min-h-[420px] md:min-h-0 flex items-center justify-center p-8 md:p-12">
              <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-[#c9a84c]/10 shadow-[0_0_40px_rgba(201,168,76,0.08)]">
                <Image
                  src="/golden-ratio.png"
                  alt="Golden Ratio spiral and grid diagram"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 58vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a08]/60 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════
            CARD 2 — Portrait Ratio & Ocular Spacing
           ══════════════════════════════════════════════ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          custom={1}
          className="relative w-full max-w-7xl rounded-2xl border border-[#c9a84c]/15 bg-[#0c0a08]/80 backdrop-blur-xl shadow-[0_0_80px_rgba(201,168,76,0.05)] overflow-hidden"
        >
          <CornerAccents />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent" />

          <div className="grid md:grid-cols-[7fr_5fr] gap-0">
            {/* Image side (left on this card for visual rhythm) */}
            <div className="relative min-h-[420px] md:min-h-0 flex items-center justify-center p-8 md:p-12 order-2 md:order-1">
              <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-[#c9a84c]/10 shadow-[0_0_40px_rgba(201,168,76,0.08)]">
                <Image
                  src="/portrait-ocular.png"
                  alt="Portrait ratio and ocular spacing diagram"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 58vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a08]/60 via-transparent to-transparent" />
              </div>
            </div>

            {/* Text side */}
            <div className="p-10 md:p-14 flex flex-col justify-center order-1 md:order-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full border border-[#c9a84c]/30 flex items-center justify-center">
                  <Ratio className="w-5 h-5 text-[#c9a84c]" />
                </div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#c9a84c]/60">
                  Facial Metrics
                </span>
              </div>

              <h3 className="text-4xl md:text-5xl font-display font-light text-[#e8d5a3] mb-6 tracking-wide">
                Portrait Ratio
              </h3>
              <p className="text-[#e8d5a3]/40 text-sm font-sans leading-relaxed mb-8">
                The <strong className="text-[#e8d5a3]/70">Portrait Ratio</strong> measures the relationship
                between the vertical height and horizontal width of the face. In classical portraiture, faces
                closest to Phi (≈&nbsp;1.618 : 1) are considered the most aesthetically harmonious. AureumCV
                calculates this by detecting the outermost facial boundary landmarks and computing their
                bounding&nbsp;ratio.
              </p>

              <div className="w-full h-px bg-gradient-to-r from-[#c9a84c]/20 via-[#c9a84c]/10 to-transparent mb-8" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full border border-[#c9a84c]/30 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-[#c9a84c]" />
                </div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#c9a84c]/60">
                  Biometric Spacing
                </span>
              </div>

              <h3 className="text-4xl md:text-5xl font-display font-light text-[#e8d5a3] mb-6 tracking-wide">
                Ocular Spacing
              </h3>
              <p className="text-[#e8d5a3]/40 text-sm font-sans leading-relaxed">
                <strong className="text-[#e8d5a3]/70">Ocular Spacing</strong> is the normalized distance
                between the inner corners of the eyes relative to the overall face width. This metric has been
                studied extensively in craniofacial research and is one of the strongest indicators of perceived
                facial balance. AureumCV expresses this as a ratio and compares it against the Phi-derived
                ideal&nbsp;(≈&nbsp;0.618).
              </p>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════
            CARD 3 — Pose Matrix
           ══════════════════════════════════════════════ */}
        <SectionDivider label="Spatial Orientation" />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          custom={0}
          className="relative w-full max-w-7xl rounded-2xl border border-[#c9a84c]/15 bg-[#0c0a08]/80 backdrop-blur-xl shadow-[0_0_80px_rgba(201,168,76,0.05)] overflow-hidden"
        >
          <CornerAccents />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent" />

          <div className="grid md:grid-cols-[5fr_7fr] gap-0">
            {/* Text side */}
            <div className="p-10 md:p-14 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full border border-[#c9a84c]/30 flex items-center justify-center">
                  <Box className="w-5 h-5 text-[#c9a84c]" />
                </div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#c9a84c]/60">
                  3D Tracking
                </span>
              </div>

              <h3 className="text-4xl md:text-5xl font-display font-light text-[#e8d5a3] mb-6 tracking-wide">
                Pose Matrix
              </h3>
              <p className="text-[#e8d5a3]/40 text-sm font-sans leading-relaxed mb-8">
                The <strong className="text-[#e8d5a3]/70">Pose Matrix</strong> captures the 3D orientation of
                the head in space. AureumCV decomposes the face-mesh transformation into three Euler angles,
                providing real-time feedback on head alignment to ensure accurate measurements.
              </p>

              {/* Axis cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    axis: 'Pitch',
                    desc: 'Up / Down tilt',
                    symbol: 'X',
                    color: '#ef4444',
                  },
                  {
                    axis: 'Yaw',
                    desc: 'Left / Right turn',
                    symbol: 'Y',
                    color: '#22c55e',
                  },
                  {
                    axis: 'Roll',
                    desc: 'Lateral head tilt',
                    symbol: 'Z',
                    color: '#3b82f6',
                  },
                ].map((item) => (
                  <div
                    key={item.axis}
                    className="relative bg-[#0a0908] border border-[#c9a84c]/10 rounded-lg p-5 flex flex-col items-center text-center gap-2 group hover:border-[#c9a84c]/30 transition-colors duration-300"
                  >
                    <span
                      className="text-3xl font-mono font-bold"
                      style={{ color: item.color }}
                    >
                      {item.symbol}
                    </span>
                    <span className="text-[#e8d5a3] text-sm font-display tracking-wide">
                      {item.axis}
                    </span>
                    <span className="text-[#e8d5a3]/30 text-[11px] font-sans">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[#e8d5a3]/30 text-xs font-sans leading-relaxed mt-6">
                Accurate proportional analysis requires a near-frontal pose. AureumCV uses the Pose Matrix to
                gate measurements — only capturing data when yaw, pitch, and roll are within a tight threshold,
                ensuring precision and repeatability.
              </p>
            </div>

            {/* Image side */}
            <div className="relative min-h-[420px] md:min-h-0 flex items-center justify-center p-8 md:p-12">
              <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-[#c9a84c]/10 shadow-[0_0_40px_rgba(201,168,76,0.08)]">
                <Image
                  src="/pose-matrix.png"
                  alt="3D Pose Matrix: Pitch, Yaw, Roll axes on a head model"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 58vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a08]/60 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Bottom tagline ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="flex flex-col items-center gap-4 pt-8 pb-8"
        >
          <div className="w-px h-16 bg-gradient-to-b from-[#c9a84c]/40 to-transparent" />
          <p className="text-[#e8d5a3]/20 text-[10px] uppercase tracking-[0.25em] font-sans text-center max-w-md">
            All processing runs locally on your device · Zero data leaves your browser
          </p>
        </motion.div>
      </div>
    </section>
  );
}
