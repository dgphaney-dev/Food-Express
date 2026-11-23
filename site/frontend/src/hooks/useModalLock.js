import { useEffect } from 'react';

let activeModalLocks = 0;
let lockedScrollY = 0;

function applyModalLock() {
  if (typeof document === 'undefined') return;

  if (activeModalLocks === 0) {
    lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;

    // Pausa Lenis smooth scroll caso esteja ativo
    if (window.__lenis && typeof window.__lenis.stop === 'function') {
      window.__lenis.stop();
    }

    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');

    // Bloqueia qualquer interação (mouse, toque, teclado, Tab, leitor de tela) com o site atrás do modal
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.setAttribute('inert', '');
      rootEl.setAttribute('aria-hidden', 'true');
    }
  }

  activeModalLocks += 1;
}

function releaseModalLock() {
  if (typeof document === 'undefined') return;

  activeModalLocks = Math.max(0, activeModalLocks - 1);

  if (activeModalLocks === 0) {
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');

    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.removeAttribute('inert');
      rootEl.removeAttribute('aria-hidden');
    }

    // Restaura Lenis smooth scroll
    if (window.__lenis && typeof window.__lenis.start === 'function') {
      window.__lenis.start();
    } else if (typeof window !== 'undefined' && window.scrollY !== lockedScrollY) {
      window.scrollTo(0, lockedScrollY);
    }
  }
}

/**
 * Trava completamente o scroll e o acesso ao site subjacente (#root)
 * enquanto qualquer modal ou drawer estiver aberto (com contagem de referência para modais aninhados).
 */
export function useModalLock(isOpen = true) {
  useEffect(() => {
    if (!isOpen) return undefined;

    applyModalLock();
    return () => {
      releaseModalLock();
    };
  }, [isOpen]);
}
