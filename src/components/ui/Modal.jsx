import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  full: 'max-w-[calc(100vw-2rem)]',
};

export default function Modal({
  open,
  onClose,
  children,
  title,
  description,
  width = 'md',
  closeOnBackdrop = true,
  closeButton = true,
  className,
}) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const overlayRef = useRef(null);

  // Handle mount / unmount animation
  useEffect(() => {
    if (open) {
      setVisible(true);
      // Trigger enter animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (closeOnBackdrop && e.target === overlayRef.current) {
        onClose?.();
      }
    },
    [closeOnBackdrop, onClose]
  );

  if (!visible) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'transition-all duration-200 ease-in-out',
        animate
          ? 'bg-surface-950/40 backdrop-blur-sm'
          : 'bg-transparent backdrop-blur-none'
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        className={clsx(
          'w-full bg-white rounded-2xl shadow-xl border border-surface-200',
          'transition-all duration-200 ease-in-out',
          animate
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2',
          widths[width],
          className
        )}
      >
        {/* Header */}
        {(title || closeButton) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-0">
            <div className="flex-1 min-w-0">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-surface-900"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-sm text-surface-500"
                >
                  {description}
                </p>
              )}
            </div>
            {closeButton && (
              <button
                onClick={onClose}
                className={clsx(
                  'ml-4 p-1.5 rounded-lg text-surface-400',
                  'hover:text-surface-600 hover:bg-surface-100',
                  'transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  'cursor-pointer'
                )}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function ModalFooter({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-end gap-3 px-6 pb-6 -mt-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Modal.Footer = ModalFooter;
