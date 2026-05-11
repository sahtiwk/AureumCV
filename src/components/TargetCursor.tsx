'use client';
import { useEffect, useRef, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import './TargetCursor.css';

interface TargetCursorProps {
  targetSelector?: string;
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  hoverDuration?: number;
  parallaxOn?: boolean;
}

const TargetCursor = ({
  targetSelector = '.cursor-target',
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true,
}: TargetCursorProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cornersRef = useRef<HTMLDivElement>(null);
  
  const isActiveRef = useRef(false);
  const targetElementRef = useRef<Element | null>(null);

  const spinTweenRef = useRef<gsap.core.Tween | null>(null);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const { clientX, clientY } = e;

    if (!isActiveRef.current) {
      // Move wrapper to mouse
      gsap.to(cursorRef.current, {
        x: clientX,
        y: clientY,
        duration: 0.1,
        ease: 'power2.out',
      });
    }
  }, [parallaxOn]);

  const onMouseEnter = useCallback((e: Event) => {
    const target = e.currentTarget as HTMLElement;
    targetElementRef.current = target;
    isActiveRef.current = true;
    
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    if (spinTweenRef.current) spinTweenRef.current.pause();
    
    gsap.to(cursorRef.current, {
      x: centerX,
      y: centerY,
      duration: hoverDuration,
      ease: 'power3.out',
    });

    gsap.to(cornersRef.current, {
      width: rect.width + 20,
      height: rect.height + 20,
      borderRadius: 4,
      rotation: 0, 
      duration: hoverDuration,
      ease: 'power3.out',
    });
  }, [hoverDuration]);

  const onMouseLeave = useCallback(() => {
    isActiveRef.current = false;
    targetElementRef.current = null;
    
    gsap.to(cornersRef.current, {
      width: 40,
      height: 40,
      borderRadius: '50%',
      duration: hoverDuration,
      ease: 'power3.out',
      onComplete: () => {
        if (!isActiveRef.current && spinTweenRef.current) {
          spinTweenRef.current.play();
        }
      }
    });
  }, [hoverDuration]);

  useEffect(() => {
    if (hideDefaultCursor) {
      document.body.classList.add('hide-cursor');
    }
    
    const handleGlobalOver = (e: MouseEvent) => {
      const target = (e.target as Element).closest(targetSelector);
      if (target) {
        onMouseEnter({ currentTarget: target } as any);
      }
    };

    const handleGlobalOut = (e: MouseEvent) => {
      const target = (e.target as Element).closest(targetSelector);
      if (target) {
        onMouseLeave();
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', handleGlobalOver);
    window.addEventListener('mouseout', handleGlobalOut);

    // Continuous rotation
    spinTweenRef.current = gsap.to(cornersRef.current, {
      rotation: 360,
      duration: spinDuration,
      repeat: -1,
      ease: 'none',
    });

    return () => {
      if (hideDefaultCursor) {
        document.body.classList.remove('hide-cursor');
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', handleGlobalOver);
      window.removeEventListener('mouseout', handleGlobalOut);
      if (spinTweenRef.current) spinTweenRef.current.kill();
    };
  }, [targetSelector, hideDefaultCursor, spinDuration, onMouseMove, onMouseEnter, onMouseLeave]);

  return (
    <div className="target-cursor-wrapper" ref={cursorRef}>
      <div className="target-cursor-corners" ref={cornersRef}>
        <span className="corner top-left" />
        <span className="corner top-right" />
        <span className="corner bottom-left" />
        <span className="corner bottom-right" />
      </div>
    </div>
  );
};

export default TargetCursor;
