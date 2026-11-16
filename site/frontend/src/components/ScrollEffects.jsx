import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * ScrollEffects Component
 * Provides luxury steakhouse scroll effects:
 * 1. Ultra-sleek gold/amber scroll progress bar at the top of the viewport
 * 2. Floating smooth back-to-top button with circular SVG progress meter
 */
export default function ScrollEffects() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    let ticking = false;

    const updateScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;

      setScrollProgress(progress);
      setShowScrollTop(scrollTop > 280);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    // Listen to standard scroll and Lenis scroll if available
    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScroll();

    if (window.__lenis) {
      window.__lenis.on('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (window.__lenis) {
        window.__lenis.off('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Circular progress calculations for SVG ring
  const circleRadius = 18;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - scrollProgress * circleCircumference;

  return (
    <>
      {/* 1. Global Luxury Scroll Progress Line at top */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none origin-left transition-transform duration-75"
        style={{
          transform: `scaleX(${scrollProgress})`,
          background: 'linear-gradient(90deg, #b45309 0%, #f59e0b 50%, #fbbf24 100%)',
          boxShadow: '0 0 12px rgba(245, 158, 11, 0.7), 0 0 24px rgba(180, 83, 9, 0.4)',
        }}
        aria-hidden="true"
      />

      {/* 2. Floating Back-to-Top Button with Progress Indicator */}
      <div
        className={`fixed bottom-6 right-6 z-40 transition-all duration-400 ease-out ${
          showScrollTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <button
          onClick={scrollToTop}
          title="Voltar ao topo da página"
          className="relative group flex items-center justify-center w-12 h-12 rounded-full bg-[#120e0c]/90 hover:bg-[#1a1411] border border-[#33261f] hover:border-amber-500/50 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Voltar ao topo"
        >
          {/* Circular SVG Scroll Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r={circleRadius}
              className="text-[#261d17]"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="22"
              cy="22"
              r={circleRadius}
              className="text-amber-400 transition-all duration-150"
              strokeWidth="2.5"
              strokeDasharray={circleCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Icon */}
          <ArrowUp
            size={18}
            className="text-amber-400 group-hover:text-amber-300 group-hover:-translate-y-0.5 transition-all duration-200 z-10"
          />
        </button>
      </div>
    </>
  );
}
