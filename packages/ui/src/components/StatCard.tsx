'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { Badge } from './Badge';
import { formatCurrency } from '../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    label: string;
    value: string;
    up: boolean;
  };
  icon?: React.ElementType;
  iconColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconColor = 'bg-primary-500/10 text-primary-500',
  className,
  children,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      whileHover={{ y: -4 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      {/* Background gradient accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-emerald-400" />

      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon && (
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', iconColor)}>
                {React.createElement(icon, { className: 'h-6 w-6' })}
              </div>
            )}
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
          </div>
          {trend && (
            <Badge
              variant={trend.up ? 'success' : 'destructive'}
              className="text-xs px-2 py-1"
            >
              {trend.value} {trend.label}
            </Badge>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {typeof value === 'number' ? formatCurrency(value) : value}
          </span>
          {subtitle && <span className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</span>}
        </div>

        {children && <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">{children}</div>}
      </div>
    </motion.div>
  );
}