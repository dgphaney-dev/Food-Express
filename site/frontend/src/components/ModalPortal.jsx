import { createPortal } from 'react-dom';
import { useModalLock } from '../hooks/useModalLock';

/**
 * Portal isolado para modais e drawers.
 * Renderiza fora de #root (direto no document.body) com z-index absoluto,
 * travando scroll da página e impedindo qualquer acesso ao site enquanto aberto.
 */
export default function ModalPortal({
  isOpen = true,
  children,
  className = '',
  zIndexClass = 'z-[100000]',
}) {
  useModalLock(isOpen);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-modal-portal="true"
      data-lenis-prevent="true"
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 ${zIndexClass} overflow-hidden ${className}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}
