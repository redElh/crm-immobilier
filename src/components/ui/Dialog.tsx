import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'react-feather';
import { useStageChrome } from '../modules/calendar/useStageChrome';
import { useStageScope } from '../dashboard/Stage';
import { cn } from '../../lib/utils';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  full: 'max-w-6xl',
};

export const Dialog = ({ isOpen, onClose, title, children, size = 'md', className }: DialogProps) => {
  const { staged, dark } = useStageChrome();
  const isAdmin = useStageScope() === 'admin';
  return createPortal(
    <div className={cn(staged ? 'agent-theme' : 'admin-theme', staged && !dark && 'stage-light', staged && 'cosmic-scope', staged && isAdmin && 'stage-admin')}>
      <div className={dark ? 'dark' : undefined}>
        <div className="stage-form">
          <AnimatePresence>
            {isOpen && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-[#050610]/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 22, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.94, y: 16, filter: 'blur(5px)' }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className={`relative w-full ${sizeClasses[size]} mx-4 bg-card rounded-2xl border border-border/50 shadow-modal ${className || ''}`}
          >
            {title && (
              <div className={cn('flex items-center justify-between px-6 py-4 border-b border-border/40', staged && 'relative')}>
                {staged && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{ background: dark ? 'radial-gradient(60% 120% at 0% 0%, rgba(124,92,255,0.10), transparent 70%)' : isAdmin ? 'radial-gradient(60% 120% at 0% 0%, rgba(249,115,22,0.08), transparent 70%)' : 'radial-gradient(60% 120% at 0% 0%, rgba(13,148,136,0.07), transparent 70%)' }}
                  />
                )}
                <h2 className={cn('relative text-lg font-semibold tracking-[-0.3px]', staged && (dark ? 'text-white' : isAdmin ? 'text-orange-950' : 'text-teal-950'))}>{title}</h2>
                <button
                  onClick={onClose}
                  className={cn(
                    'relative w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                    staged
                      ? dark
                        ? 'border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.10] hover:text-white'
                        : 'border border-teal-900/10 bg-white/70 text-slate-500 hover:bg-white hover:text-teal-900'
                      : 'text-text-secondary hover:text-text hover:bg-background',
                  )}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="px-6 py-4">
              {children}
            </div>
          </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>,
    document.body,
  );
};
