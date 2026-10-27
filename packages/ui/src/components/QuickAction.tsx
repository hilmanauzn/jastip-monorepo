'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface QuickActionCardProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  color?: string;
  badge?: number | string;
  disabled?: boolean;
  className?: string;
}

export function QuickActionCard({
  icon,
  label,
  description,
  href,
  onClick,
  color = 'bg-blue-100 text-blue-600',
  badge,
  disabled = false,
  className,
}: QuickActionCardProps) {
  const isLink = !!href;

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    if (isLink) return; // Let the link handle navigation
    onClick?.();
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled}
      className={cn(
        'flex flex-col items-start gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isLink ? (
        <a href={href} className="w-full h-full">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
            {React.createElement(icon, { className: 'h-6 w-6' })}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h3>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
          )}
          {badge !== undefined && (
            <span className={cn(
              'mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
            )}>
              {badge}
            </span>
          )}
          <span className="text-primary-500 text-xs font-medium">Lihat selengkapnya →</span>
        </a>
      ) : (
        <>
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
            {React.createElement(icon, { className: 'h-6 w-6' })}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h3>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
          )}
          {badge !== undefined && (
            <span className={cn(
              'mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
            )}>
              {badge}
            </span>
          )}
          {(isLink || onClick) && (
            <span className="text-primary-500 text-xs font-medium">Lihat selengkapnya →</span>
          )}
        </>
      )}
    </motion.button>
  );
}

interface QuickActionGridProps {
  actions: QuickActionCardProps[];
  cols?: 1 | 2 | 3 | 4 | 6;
  className?: string;
}

export function QuickActionGrid({ actions, cols = 3, className }: QuickActionGridProps) {
  const colMap = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 6: 'grid-cols-6' };
  const smColMap = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4', 6: 'sm:grid-cols-4' };
  const lgColMap = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 6: 'lg:grid-cols-6' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        `grid gap-4 ${colMap[cols]} ${smColMap[cols]} ${lgColMap[cols]}`,
        className
      )}
    >
      {actions.map((action, index) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <QuickActionCard {...action} />
        </motion.div>
      ))}
    </motion.div>
  );
}