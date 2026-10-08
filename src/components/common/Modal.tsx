/**
 * MTN ENTERPRISE HUB - ACCESSIBLE MODAL DIALOG
 */

import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  actions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  actions,
}) => {
  const titleId = useId();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case '3xl':
        return 'max-w-3xl';
      default:
        return 'max-w-lg';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      {/* Backdrop */}
      <div
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog container */}
      <div className="flex min-h-full items-start justify-center p-2 text-center sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`relative flex max-h-[calc(100dvh-1rem)] w-full transform flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl transition-all sm:my-8 sm:max-h-[calc(100dvh-2rem)] ${getMaxWidthClass()}`}
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:p-6">
            <div className="min-w-0">
              <h3 id={titleId} className="break-words text-lg font-bold text-slate-900 font-heading sm:text-xl">
                {title}
              </h3>
              {subtitle && <p className="mt-1 break-words text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div>

          {/* Footer Actions */}
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 p-3 sm:gap-3 sm:p-6 [&>*]:max-w-full">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
