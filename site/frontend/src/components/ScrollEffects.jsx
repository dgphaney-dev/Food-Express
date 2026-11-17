import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const SECTIONS = [
  { id: 'topo', label: 'Início' },
  { id: 'nossos-produtos', label: 'Destaques' },
  { id: 'experiencia-section', label: 'Experiência' },
  { id: 'localizacao', label: 'Localização' },
  { id: 'avaliacoes', label: 'Avaliações' },
];

/**
 * ScrollEffects Component
 * Provides luxury steakhouse scroll effects:
 * 1. Ultra-sleek gold/amber scroll progress bar at the top of the viewport with active spark
 * 2. Side Section Tracker dots with smooth Lenis jump
 * 3. Floating smooth back-to-top button with circular SVG progress meter
 */
export default function ScrollEffects() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState('topo');

  useEffect(() => {
    let ticking = false;

    const updateScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;

      setScrollProgress(progress);
      setShowScrollTop(scrollTop > 280);

      // Track active section along viewport
      const scrollCenter = scrollTop + window.innerHeight * 0.4;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const top = rect.top + scrollTop;
          if (scrollCenter >= top) {
            setActiveSection(SECTIONS[i].id);
            break;
          }
        }
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

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

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    if (window.__lenis) {
      window.__lenis.scrollTo(el, { offset: -60, duration: 1.2 });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        className="fixed top-0 left-0 right-0 h-[3.5px] z-[9999] pointer-events-none origin-left transition-transform duration-75"
        style={{
          transform: `scaleX(${scrollProgress})`,
          background: 'linear-gradient(90deg, #ea580c 0%, #f59e0b 50%, #fef08a 100%)',
          boxShadow: '0 0 12px rgba(245, 158, 11, 0.8), 0 0 24px rgba(234, 88, 12, 0.5)',
        }}
        aria-hidden="true"
      />
      {scrollProgress > 0.01 && (
        <div
          className="fixed top-0 h-[3.5px] w-4 z-[9999] pointer-events-none -translate-x-full transition-all duration-75"
          style={{
            left: `${scrollProgress * 100}%`,
            background: '#ffffff',
            boxShadow: '0 0 10px #fbbf24, 0 0 20px #f59e0b, 0 0 30px #ea580c',
            borderRadius: '9999px',
          }}
          aria-hidden="true"
        />
      )}

      {/* 2. Side Section Tracker Dots for Desktop (Minimalist Luxury) */}
      <nav
        aria-label="Navegação rápida por seções"
        className={`hidden xl:flex fixed right-5 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-3.5 transition-all duration-500 pointer-events-auto ${
          scrollProgress > 0.04 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}
      >
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className="group flex items-center gap-2 cursor-pointer focus:outline-none"
              title={sec.label}
              aria-label={`Ir para seção ${sec.label}`}
            >
              <span
                className={`text-[10px] uppercase font-['Oswald',sans-serif] tracking-wider px-2 py-0.5 rounded-md bg-[#17120e]/95 border border-[#2d221a] text-stone-300 transition-all duration-200 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 pointer-events-none shadow-md ${
                  isActive ? 'text-amber-400 border-amber-500/50' : ''
                }`}
              >
                {sec.label}
              </span>
              <div
                className={`transition-all duration-300 rounded-full ${
                  isActive
                    ? 'w-2.5 h-6 bg-gradient-to-b from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                    : 'w-2 h-2 bg-[#2d221a] group-hover:bg-amber-500/60 group-hover:scale-125'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* 3. Floating Back-to-Top Button with Progress Indicator */}
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
