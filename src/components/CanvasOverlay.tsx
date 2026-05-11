'use client';
import { useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { FaceLandmarker } from '@mediapipe/tasks-vision';

export default function CanvasOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { appState } = useAppStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const state = useAppStore.getState();
      
      if (state.appState === 'ANALYZING' && state.currentFaceResult) {
        const { landmarks, phiMetrics } = state.currentFaceResult;
        
        // Premium gold mesh
        let meshColor = 'rgba(201, 168, 76, 0.15)'; 
        if (phiMetrics) {
          if (phiMetrics.symmetryScore >= 95) meshColor = 'rgba(201, 168, 76, 0.4)'; 
          else if (phiMetrics.symmetryScore < 90) meshColor = 'rgba(248, 113, 113, 0.2)'; // Reddish for poor symmetry
        }

        // Draw Tesselation Mesh
        ctx.strokeStyle = meshColor;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (const connection of FaceLandmarker.FACE_LANDMARKS_TESSELATION) {
          const pt1 = landmarks[connection.start];
          const pt2 = landmarks[connection.end];
          if (pt1 && pt2) {
            ctx.moveTo((1 - pt1.x) * canvas.width, pt1.y * canvas.height);
            ctx.lineTo((1 - pt2.x) * canvas.width, pt2.y * canvas.height);
          }
        }
        ctx.stroke();

        // Draw Structural Geometry Lines
        if (landmarks.length > 454) {
          ctx.lineWidth = 1;
          
          const getCoords = (idx: number) => ({
            x: (1 - landmarks[idx].x) * canvas.width,
            y: landmarks[idx].y * canvas.height
          });

          const p10 = getCoords(10); 
          const p152 = getCoords(152); 
          const p234 = getCoords(234); 
          const p454 = getCoords(454); 

          // Symmetry Axis (Vertical)
          ctx.strokeStyle = 'rgba(232, 213, 163, 0.3)'; // Warm white
          ctx.setLineDash([10, 10]);
          ctx.beginPath();
          ctx.moveTo(p10.x, p10.y);
          ctx.lineTo(p152.x, p152.y);
          ctx.stroke();

          // Golden Ratio Cross (Horizontal)
          ctx.beginPath();
          ctx.moveTo(p234.x, p234.y);
          ctx.lineTo(p454.x, p454.y);
          ctx.stroke();
          ctx.setLineDash([]); 

          // Centering Logic
          const xs = landmarks.map(p => (1 - p.x) * canvas.width);
          const ys = landmarks.map(p => p.y * canvas.height);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          const faceCenterX = (minX + maxX) / 2;
          const faceCenterY = (minY + maxY) / 2;
          const screenCenterX = canvas.width / 2;
          const screenCenterY = canvas.height / 2;

          const toleranceX = canvas.width * 0.15;
          const toleranceY = canvas.height * 0.15;
          
          const isCenteredX = Math.abs(faceCenterX - screenCenterX) < toleranceX;
          const isCenteredY = Math.abs(faceCenterY - screenCenterY) < toleranceY;

          if (!isCenteredX || !isCenteredY) {
            ctx.fillStyle = 'rgba(248, 113, 113, 0.8)'; 
            ctx.font = '200 14px var(--font-sans)';
            ctx.textAlign = 'center';
            ctx.letterSpacing = '0.3em';
            ctx.fillText("CENTRE POSITION", canvas.width / 2, 80);
            ctx.letterSpacing = 'normal';
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [appState]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
    />
  );
}
