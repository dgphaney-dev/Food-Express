import { useEffect, useRef, useState } from 'react';

/**
 * MouseSpotlight Component
 * Renders an ultra-smooth, subtle ambient warm glow that glides across the dark background
 * following the user's cursor.
 */
export default function MouseSpotlight() {
  const [pos, setPos] = useState({ x: -1000, y: -1000, opacity: 0 });
  const [hasMouse, setHasMouse] = useState(true);
  const targetPos = useRef({ x: -1000, y: -1000, opacity: 0 });
  const currentPos = useRef({ x: -1000, y: -1000, opacity: 0 });
  const rafId = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: fine)');
    setHasMouse(mq.matches);

    const handlePointerTypeChange = (e) => setHasMouse(e.matches);
    mq.addEventListener('change', handlePointerTypeChange);
    return () => mq.removeEventListener('change', handlePointerTypeChange);
  }, []);

  useEffect(() => {
    if (!hasMouse) return;

    const handleMouseMove = (e) => {
      targetPos.current = {
        x: e.clientX,
        y: e.clientY,
        opacity: 1,
      };
    };

    const handleMouseLeave = () => {
      targetPos.current.opacity = 0;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Smooth lerp loop
    const tick = () => {
      // Lerp smoothing (15% interpolation per frame)
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.15;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.15;
      currentPos.current.opacity += (targetPos.current.opacity - currentPos.current.opacity) * 0.15;

      setPos({
        x: Math.round(currentPos.current.x),
        y: Math.round(currentPos.current.y),
        opacity: Number(currentPos.current.opacity.toFixed(3)),
      });

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [hasMouse]);

  if (!hasMouse || pos.opacity <= 0.01) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden transition-opacity duration-300"
      style={{
        opacity: pos.opacity,
      }}
    >
      <div
        className="absolute w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] pointer-events-none will-change-transform"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.055) 0%, rgba(234, 88, 12, 0.025) 45%, transparent 75%)',
        }}
      />
    </div>
  );
}
