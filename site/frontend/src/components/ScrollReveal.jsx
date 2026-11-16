import { useRef, useState, useEffect } from 'react';

/**
 * ScrollReveal Component
 * Animates children into view both when scrolling down AND when scrolling back up (bidirectional "ir e voltar").
 * Replicates the modern momentum & focus-in (blur + scale + translate) effects from convertecom.com.br.
 */
export default function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 700,
  distance = 32,
  threshold = 0.08,
  withBlur = true,
  withScale = true,
  once = false, // Bidirecional: anima tanto na descida quanto na subida
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
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  // Compute transform offset based on direction and viewport entry/exit
  const scalePart = withScale ? ' scale(0.96)' : '';
  let hiddenTransform = `translate3d(0, ${distance}px, 0)${scalePart}`;

  if (direction === 'down' || exitDirection === 'top') {
    hiddenTransform = `translate3d(0, -${distance}px, 0)${scalePart}`;
  } else if (direction === 'left') {
    hiddenTransform = `translate3d(-${distance}px, 0, 0)${scalePart}`;
  } else if (direction === 'right') {
    hiddenTransform = `translate3d(${distance}px, 0, 0)${scalePart}`;
  } else if (direction === 'zoom') {
    hiddenTransform = 'scale(0.92)';
  }

  const style = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : hiddenTransform,
    filter: withBlur ? (isVisible ? 'blur(0px)' : 'blur(4px)') : undefined,
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
