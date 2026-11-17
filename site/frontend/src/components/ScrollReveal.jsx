import { useRef, useState, useEffect } from 'react';

/**
 * ScrollReveal Component
 * Animates children dynamically both when scrolling DOWN AND when scrolling back UP (bidirectional "ir e voltar").
 * Combines 3D perspective depth, momentum focus-in (blur + scale + translate) with silky ease-out physics.
 */
export default function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 750,
  distance = 48,
  threshold = 0.1,
  withBlur = true,
  withScale = true,
  withTilt = true,
  once = false, // Bidirecional ativo: anima tanto na descida quanto na subida
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [exitDirection, setExitDirection] = useState('bottom'); // 'bottom' or 'top'

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(el);
          }
        } else if (!once) {
          setIsVisible(false);
          // Detect whether element left through top or bottom of viewport
          const rect = entry.boundingClientRect;
          if (rect.top > 0) {
            setExitDirection('bottom');
          } else {
            setExitDirection('top');
          }
        }
      },
      {
        threshold,
        rootMargin: '-20px 0px -40px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  // Compute 3D transform offset based on direction and viewport entry/exit
  const scalePart = withScale ? ' scale(0.93)' : '';
  const tiltPart = withTilt
    ? exitDirection === 'top' || direction === 'down'
      ? ' rotateX(-5deg)'
      : ' rotateX(5deg)'
    : '';

  let hiddenTransform = `perspective(1000px) translate3d(0, ${distance}px, 0)${scalePart}${tiltPart}`;

  if (direction === 'down' || exitDirection === 'top') {
    hiddenTransform = `perspective(1000px) translate3d(0, -${distance}px, 0)${scalePart}${tiltPart}`;
  } else if (direction === 'left') {
    hiddenTransform = `perspective(1000px) translate3d(-${distance}px, 0, 0)${scalePart}`;
  } else if (direction === 'right') {
    hiddenTransform = `perspective(1000px) translate3d(${distance}px, 0, 0)${scalePart}`;
  } else if (direction === 'zoom') {
    hiddenTransform = 'perspective(1000px) scale(0.88)';
  }

  const style = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'perspective(1000px) translate3d(0, 0, 0) scale(1) rotateX(0deg)' : hiddenTransform,
    filter: withBlur ? (isVisible ? 'blur(0px)' : 'blur(8px)') : undefined,
    transitionProperty: 'opacity, transform, filter',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: isVisible ? `${delay}ms` : '0ms',
    willChange: 'opacity, transform, filter',
  };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
