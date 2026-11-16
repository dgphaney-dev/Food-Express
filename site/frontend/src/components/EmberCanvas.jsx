import { useEffect, useRef } from 'react';

/**
 * EmberCanvas — Efeito visual de brasas vivas e fagulhas douradas flutuando suavemente
 * Traz a atmosfera autêntica de fogo e brasa de uma steakhouse de alto padrão.
 * Altamente performático: usa requestAnimationFrame, pausa fora de foco e tem consumo mínimo de CPU.
 */
export default function EmberCanvas({
  count = 32,
  className = 'absolute inset-0 pointer-events-none z-10',
  speed = 1,
  color = '#f59e0b',
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    // Criação das partículas de brasa
    class Ember {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + Math.random() * 20;
        this.size = Math.random() * 2.2 + 0.8;
        this.speedY = (Math.random() * 0.7 + 0.3) * speed;
        this.speedX = (Math.random() - 0.5) * 0.4 * speed;
        this.opacity = Math.random() * 0.6 + 0.2;
        this.maxOpacity = this.opacity;
        this.fadeSpeed = Math.random() * 0.004 + 0.002;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.03 + 0.01;
      }

      update() {
        this.y -= this.speedY;
        this.wobble += this.wobbleSpeed;
        this.x += Math.sin(this.wobble) * 0.35 + this.speedX;

        // Desvanece conforme sobe
        if (this.y < height * 0.3) {
          this.opacity -= this.fadeSpeed * 1.5;
        }

        if (this.y < -10 || this.opacity <= 0 || this.x < -10 || this.x > width + 10) {
          this.reset(false);
        }
      }

      draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

        // Glow circular suave
        const gradient = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.size * 2
        );
        gradient.addColorStop(0, `rgba(251, 191, 36, ${this.opacity})`);
        gradient.addColorStop(0.5, `rgba(217, 119, 6, ${this.opacity * 0.6})`);
        gradient.addColorStop(1, 'rgba(180, 83, 9, 0)');

        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
        ctx.shadowBlur = this.size * 3;
        ctx.fill();
        ctx.restore();
      }
    }

    const embers = Array.from({ length: count }, () => new Ember());

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const render = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < embers.length; i++) {
          embers[i].update();
          embers[i].draw();
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [count, speed, color]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
}
