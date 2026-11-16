import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * TiltCard Component
 * Implements modern 3D perspective tilt and interactive specular glare that tracks the mouse cursor.
 * Inspired by luxury Awwwards and Apple/Stripe interactive cards.
 */
export default function TiltCard({
  children,
  className = '',
  maxTilt = 7, // Maximum tilt in degrees
  scale = 1.02, // Subtle scale on hover
  glare = true,
  glareOpacity = 0.22,
  perspective = 1000,
  onClick,
}) {
  const cardRef = useRef(null);
  const rafId = useRef(null);

  const [tilt, setTilt] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
  });
  const [isHovered, setIsHovered] = useState(false);
  const [hasMouse, setHasMouse] = useState(true);

  // Check if device supports fine mouse pointer
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(pointer: fine)');
      setHasMouse(mq.matches);
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!hasMouse || !cardRef.current) return;

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Relative coordinates from -1 (left/top) to +1 (right/bottom)
        const normX = Math.max(-1, Math.min(1, ((x / rect.width) - 0.5) * 2));
        const normY = Math.max(-1, Math.min(1, ((y / rect.height) - 0.5) * 2));

        // Invert Y for standard natural 3D tilt
        const rotateX = -normY * maxTilt;
        const rotateY = normX * maxTilt;

        setTilt({
          rotateX,
          rotateY,
          glareX: (x / rect.width) * 100,
          glareY: (y / rect.height) * 100,
        });
      });
    },
    [hasMouse, maxTilt]
  );

  const handleMouseEnter = () => {
    if (!hasMouse) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!hasMouse) return;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setIsHovered(false);
    setTilt({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
    });
  };

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  if (!hasMouse) {
    return (
      <div onClick={onClick} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative will-change-transform ${className}`}
      style={{
        transform: isHovered
          ? `perspective(${perspective}px) rotateX(${tilt.rotateX.toFixed(2)}deg) rotateY(${tilt.rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, 1)`
          : `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
        transition: isHovered
          ? 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)'
          : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}

      {/* Dynamic specular mouse-following glare sheen */}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden transition-opacity duration-300"
          style={{
            opacity: isHovered ? glareOpacity : 0,
            background: `radial-gradient(circle 320px at ${tilt.glareX}% ${tilt.glareY}%, rgba(245, 158, 11, 0.35), transparent 75%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}
    </div>
  );
}
