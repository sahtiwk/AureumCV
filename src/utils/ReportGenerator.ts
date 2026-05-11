import type { FaceAnalysisResult } from '@/types';

export interface ReportParams {
  displayImage: string;          // base64 face image
  analysisSource: 'camera' | 'upload';
  result: FaceAnalysisResult;
}

const W = 1080;
const H = 1440;

function getInterpretation(phiScore: number, symmetryScore: number): string {
  if (phiScore >= 95) {
    return `Exceptional geometric harmony. Your facial proportions (φ ≈ ${(phiScore / 100 * 1.618).toFixed(3)}) closely approximate the Golden Ratio (φ = 1.618). A symmetry score of ${symmetryScore.toFixed(1)}% reflects highly balanced bilateral facial structure.`;
  } else if (phiScore >= 85) {
    return `Strong facial symmetry with proportions closely matching the Golden Ratio. A score of ${phiScore.toFixed(1)}% places you in the upper tier of geometric harmony, with well-balanced facial thirds and bilateral alignment.`;
  } else if (phiScore >= 70) {
    return `Above-average facial geometry with notable Phi alignment. A score of ${phiScore.toFixed(1)}% indicates good proportional consistency. Minor asymmetries are natural and universal in human faces.`;
  } else {
    return `Facial proportions show characteristic asymmetry, which is entirely natural. A score of ${phiScore.toFixed(1)}% reflects the uniqueness of your facial geometry — perfect symmetry is exceptionally rare in nature.`;
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generateReport(params: ReportParams): Promise<string> {
  const { displayImage, analysisSource, result } = params;
  const { phiMetrics, qualityMetrics } = result;

  if (!phiMetrics || !qualityMetrics) throw new Error('Missing metrics');

  // Wait for fonts to be ready
  await document.fonts.ready;

  // Get computed font families from CSS variables
  const style = getComputedStyle(document.documentElement);
  const fontDisplay = style.getPropertyValue('--font-display') || "'Cormorant Garamond', serif";
  const fontSans = style.getPropertyValue('--font-sans') || "'DM Sans', sans-serif";
  const fontMono = style.getPropertyValue('--font-mono') || "'Space Grotesk', monospace";

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ─── Background ───────────────────────────────────────────────────────────
  ctx.fillStyle = '#0a0908';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid/texture
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ─── Header ───────────────────────────────────────────────────────────────
  const headerH = 140;
  ctx.fillStyle = 'rgba(201, 168, 76, 0.02)';
  ctx.fillRect(0, 0, W, headerH);
  
  // Gold top line
  ctx.fillStyle = '#c9a84c';
  ctx.fillRect(0, 0, W, 2);

  // App name - Display font
  ctx.font = `italic 400 48px ${fontDisplay}`;
  ctx.fillStyle = '#e8d5a3';
  ctx.textAlign = 'left';
  ctx.fillText('AureumCV', 64, 70);

  // Sub-label - Sans font
  ctx.font = `200 16px ${fontSans}`;
  ctx.fillStyle = 'rgba(201, 168, 76, 0.4)';
  ctx.letterSpacing = '0.3em';
  ctx.fillText('BIOMETRIC GEOMETRY ANALYSIS', 64, 100);
  ctx.letterSpacing = 'normal';

  // Source badge
  const badgeLabel = analysisSource === 'camera' ? 'LIVE STREAM' : 'STATIC PORTRAIT';
  const badgeX = W - 64;
  ctx.font = `500 12px ${fontSans}`;
  ctx.fillStyle = '#c9a84c';
  ctx.textAlign = 'right';
  ctx.letterSpacing = '0.2em';
  ctx.fillText(badgeLabel, badgeX, 60);
  ctx.letterSpacing = 'normal';

  // Date/time - Mono font for numbers
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  ctx.font = `400 14px ${fontMono}`;
  ctx.fillStyle = 'rgba(232, 213, 163, 0.2)';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, badgeX, 90);

  // ─── Face Image + Hero Score ───────────────────────────────────────────────
  const sectionTop = headerH + 60;
  const imgSize = 420;
  const imgX = 64;
  const imgY = sectionTop;

  // Image container with gold border and accents
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.2)';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, imgX - 10, imgY - 10, imgSize + 20, imgSize + 20, 4);
  ctx.stroke();

  // Corner Accents
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 2;
  const accentSize = 20;
  // Top Left
  ctx.beginPath();
  ctx.moveTo(imgX - 10, imgY + accentSize);
  ctx.lineTo(imgX - 10, imgY - 10);
  ctx.lineTo(imgX + accentSize, imgY - 10);
  ctx.stroke();
  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(imgX + imgSize + 10 - accentSize, imgY + imgSize + 10);
  ctx.lineTo(imgX + imgSize + 10, imgY + imgSize + 10);
  ctx.lineTo(imgX + imgSize + 10, imgY + imgSize + 10 - accentSize);
  ctx.stroke();

  // Draw face image
  ctx.save();
  drawRoundedRect(ctx, imgX, imgY, imgSize, imgSize, 2);
  ctx.clip();
  const faceImg = new Image();
  await new Promise<void>((res) => {
    faceImg.onload = () => {
      const scale = Math.max(imgSize / faceImg.width, imgSize / faceImg.height);
      const drawW = faceImg.width * scale;
      const drawH = faceImg.height * scale;
      ctx.drawImage(faceImg, imgX + (imgSize - drawW) / 2, imgY + (imgSize - drawH) / 2, drawW, drawH);
      res();
    };
    faceImg.src = displayImage;
  });
  ctx.restore();

  // Hero score panel
  const heroX = imgX + imgSize + 60;
  const heroW = W - heroX - 64;

  ctx.font = `500 12px ${fontSans}`;
  ctx.fillStyle = 'rgba(201, 168, 76, 0.6)';
  ctx.textAlign = 'left';
  ctx.letterSpacing = '0.3em';
  ctx.fillText('GOLDEN RATIO MATCH', heroX, sectionTop + 40);
  ctx.letterSpacing = 'normal';

  // Big score number - Mono font
  const scoreText = phiMetrics.phiScore.toFixed(1);
  ctx.font = `300 140px ${fontMono}`;
  ctx.fillStyle = '#e8d5a3';
  ctx.textAlign = 'left';
  ctx.fillText(scoreText, heroX - 5, sectionTop + 160);

  const scoreMetrics = ctx.measureText(scoreText);
  ctx.font = `300 40px ${fontDisplay}`;
  ctx.fillStyle = 'rgba(201, 168, 76, 0.4)';
  ctx.fillText('%', heroX + scoreMetrics.width + 10, sectionTop + 160);

  // Divider
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(heroX, sectionTop + 200); ctx.lineTo(heroX + heroW, sectionTop + 200); ctx.stroke();

  // Mini-stats - Mono font for values
  const miniStats = [
    { label: 'Symmetry', value: `${phiMetrics.symmetryScore.toFixed(1)}%` },
    { label: 'Portrait', value: phiMetrics.facialRatio.toFixed(3) },
    { label: 'Ocular', value: phiMetrics.eyeSpacingRatio.toFixed(3) },
  ];

  const miniTop = sectionTop + 250;
  miniStats.forEach((s, i) => {
    const my = miniTop + i * 70;
    ctx.font = `200 11px ${fontSans}`;
    ctx.fillStyle = 'rgba(232, 213, 163, 0.3)';
    ctx.letterSpacing = '0.2em';
    ctx.fillText(s.label.toUpperCase(), heroX, my);
    ctx.letterSpacing = 'normal';

    ctx.font = `400 32px ${fontMono}`;
    ctx.fillStyle = '#e8d5a3';
    ctx.fillText(s.value, heroX, my + 35);
  });

  // ─── Divider ──────────────────────────────────────────────────────────────
  const divY1 = sectionTop + imgSize + 80;
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.1)';
  ctx.beginPath(); ctx.moveTo(64, divY1); ctx.lineTo(W - 64, divY1); ctx.stroke();

  // ─── Metrics Grid ─────────────────────────────────────────────────────────
  const gridTop = divY1 + 40;
  ctx.font = `500 11px ${fontSans}`;
  ctx.fillStyle = 'rgba(201, 168, 76, 0.4)';
  ctx.letterSpacing = '0.2em';
  ctx.fillText('DETAILED GEOMETRY', 64, gridTop);
  ctx.letterSpacing = 'normal';

  const cards = [
    { label: 'SYMMETRY', value: `${phiMetrics.symmetryScore.toFixed(1)}%` },
    { label: 'FACIAL RATIO', value: phiMetrics.facialRatio.toFixed(3) },
    { label: 'EYE SPACING', value: phiMetrics.eyeSpacingRatio.toFixed(3) },
    { label: 'PHI MATCH', value: `${phiMetrics.phiScore.toFixed(1)}%` },
  ];

  const cardW = (W - 128 - 60) / 4;
  const cardH = 140;
  const cardTop = gridTop + 30;

  cards.forEach((c, i) => {
    const cx = 64 + i * (cardW + 20);
    // Gold border card
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.15)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, cx, cardTop, cardW, cardH, 2);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(201, 168, 76, 0.02)';
    ctx.fill();

    ctx.font = `300 9px ${fontSans}`;
    ctx.fillStyle = 'rgba(232, 213, 163, 0.3)';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '0.2em';
    ctx.fillText(c.label, cx + cardW / 2, cardTop + 35);
    ctx.letterSpacing = 'normal';

    ctx.font = `400 32px ${fontMono}`;
    ctx.fillStyle = '#e8d5a3';
    ctx.fillText(c.value, cx + cardW / 2, cardTop + 90);
  });

  // ─── Interpretation ───────────────────────────────────────────────────────
  const interTop = cardTop + cardH + 60;
  ctx.font = `500 11px ${fontSans}`;
  ctx.fillStyle = 'rgba(201, 168, 76, 0.4)';
  ctx.letterSpacing = '0.2em';
  ctx.textAlign = 'left';
  ctx.fillText('ANALYTICAL INTERPRETATION', 64, interTop);
  ctx.letterSpacing = 'normal';

  drawRoundedRect(ctx, 64, interTop + 30, W - 128, 180, 4);
  ctx.fillStyle = 'rgba(201, 168, 76, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.1)';
  ctx.stroke();

  const interText = getInterpretation(phiMetrics.phiScore, phiMetrics.symmetryScore);
  ctx.font = `italic 300 24px ${fontDisplay}`;
  ctx.fillStyle = 'rgba(232, 213, 163, 0.7)';
  ctx.textAlign = 'left';
  const maxLineW = W - 128 - 80;
  const words = interText.split(' ');
  let line = '';
  let lineY = interTop + 80;
  const lineH = 36;
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxLineW && line) {
      ctx.fillText(line, 104, lineY);
      line = word;
      lineY += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, 104, lineY);

  // ─── Footer ───────────────────────────────────────────────────────────────
  const footerY = H - 100;
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(64, footerY); ctx.lineTo(W - 64, footerY); ctx.stroke();

  ctx.font = `300 14px ${fontSans}`;
  ctx.fillStyle = 'rgba(232, 213, 163, 0.2)';
  ctx.textAlign = 'left';
  ctx.fillText('Secure local processing — zero data transmission.', 64, footerY + 40);

  ctx.font = `400 14px ${fontDisplay}`;
  ctx.fillStyle = 'rgba(201, 168, 76, 0.4)';
  ctx.textAlign = 'right';
  ctx.fillText('AUREUMCV // FACIAL GEOMETRY ENGINE', W - 64, footerY + 40);

  return canvas.toDataURL('image/png');
}

