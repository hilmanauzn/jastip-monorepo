'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

interface TabsListProps {
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  disabled?: boolean;
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const tabsListStyles = 'inline-flex items-center justify-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-transparent';

const tabsTriggerStyles = 'rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-primary-400';

export function Tabs({
  value,
  onValueChange,
  children,
  className,
  orientation = 'horizontal',
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange, orientation }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  );
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
} | null>(null);

function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('Tabs components must be used within Tabs');
  return context;
}

export function TabsList({ className, children }: TabsListProps & { children?: React.ReactNode }) {
  return (
    <div className={cn(tabsListStyles, className)}>
      {children}
    </div>
  );
}

// We need to collect children triggers to render them properly
export function TabsTrigger({ value, className, disabled, children }: TabsTriggerProps & { children?: React.ReactNode }) {
  const { value: currentValue, onValueChange, orientation } = useTabs()!;
  const isActive = currentValue === value;

  return (
    <button
      onClick={() => onValueChange(value)}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center whitespace-nowrap',
        orientation === 'horizontal' ? 'px-3 py-1.5' : 'px-6 py-2',
        tabsTriggerStyles,
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className
      )}
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const { value: currentValue } = useTabs()!;
  const isActive = currentValue === value;

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn('fade-in', className)}
    >
      {children}
    </motion.div>
  );
}