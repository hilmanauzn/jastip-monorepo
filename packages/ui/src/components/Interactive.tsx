'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { ChevronDown } from 'lucide-react';

interface DropdownItemProps {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  shortcut?: string;
}

interface DropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  items: DropdownItemProps[];
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function DropdownItem({
  label,
  onClick,
  icon,
  disabled = false,
  className,
  shortcut,
}: DropdownItemProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-left transition-colors',
        disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
        className
      )}
    >
      {icon && <span className="w-4 h-4 shrink-0">{icon}</span>}
      <span>{label}</span>
      {shortcut && (
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{shortcut}</span>
      )}
    </button>
  );
}

export function Dropdown({
  open,
  onOpenChange,
  trigger,
  items,
  align = 'start',
  className,
}: DropdownProps) {
  return (
    <div className="relative inline-block">
      <button
        onClick={() => onOpenChange(!open)}
        className="flex items-center gap-1"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {React.isValidElement(trigger) ? React.cloneElement(trigger as React.ReactElement, { className: cn((trigger as React.ReactElement).props.className) }) : trigger}
        <ChevronDown className="w-4 h-4" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={open ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -10, scale: 0.95 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className={cn(
          'absolute z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl p-1 dark:border-gray-700 dark:bg-gray-800',
          align === 'start' ? 'left-0' : align === 'center' ? '-ml-[calc(50%-112px)]' : 'right-0',
          className
        )}
      >
        {items.map((item, index) => (
          <DropdownItem key={index} {...item} />
        ))}
      </motion.div>
    </div>
  );
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ content, children, side = 'top', delay = 100 }: TooltipProps) {
  const [show, setShow] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const sideStyles = {
    top: '-bottom-4 left-1/2 -translate-x-1/2',
    bottom: 'top-4 left-1/2 -translate-x-1/2',
    left: '-right-4 top-1/2 -translate-y-1/2',
    right: 'left-4 top-1/2 -translate-y-1/2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2',
    bottom: 'bottom-full left-1/2 -translate-x-1/2',
    left: 'right-full top-1/2 -translate-y-1/2',
    right: 'left-full top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative inline-block" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {React.cloneElement(React.Children.only(children) as React.ReactElement, {
        onMouseEnter: handleEnter,
        onMouseLeave: handleLeave,
      })}

      {show && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className={cn(
            'absolute z-50 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-gray-900 shadow-lg whitespace-nowrap',
            sideStyles[side]
          )}
        >
          {content}
          <motion.div
            className={cn('absolute w-3 h-3 rotate-45 bg-gray-900', arrowStyles[side])}
            animate={{ opacity: 1 }}
          />
        </motion.div>
      )}
    </div>
  );

  function handleEnter() {
    timerRef.current = setTimeout(() => setShow(true), delay);
  }

  function handleLeave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(false);
  }
}