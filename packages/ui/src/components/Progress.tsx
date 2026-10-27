'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Separator({ orientation = 'horizontal', className }: SeparatorProps) {
  return (
    <div
      className={cn(
        'shrink-0 border-gray-200 dark:border-gray-700',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
    />
  );
}

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'emerald' | 'blue';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const progressColors = {
  primary: 'bg-primary-600',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
};

const progressSizes = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export function Progress({
  value,
  max = 100,
  className,
  color = 'primary',
  showLabel = false,
  size = 'md',
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Progress</span>
          <span className="text-xs font-medium text-gray-900 dark:text-white">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn(
        'overflow-hidden rounded-full border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700',
        progressSizes[size],
        className
      )}>
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            progressColors[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Divider({ orientation = 'horizontal', className }: DividerProps) {
  return (
    <div
      className={cn(
        'relative flex w-full items-center border-gray-200 dark:border-gray-700 my-4',
        orientation === 'horizontal' ? 'h-px border-t' : 'w-px border-l h-full',
        className
      )}
    />
  );
}