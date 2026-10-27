'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: React.ReactNode;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export function Avatar({
  src,
  alt,
  size = 'md',
  className,
  fallback,
}: AvatarProps) {
  return (
    <div
      className={cn(
        'relative flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700',
        sizeMap[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt || 'User'} className="w-full h-full object-cover" />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-gray-500 dark:text-gray-400 font-medium">
          {fallback || (alt ? alt.charAt(0).toUpperCase() : '?')}
        </div>
      )}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: (string | React.ReactNode)[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarGroup({
  avatars,
  maxVisible = 4,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const hiddenCount = avatars.length - maxVisible;

  return (
    <div className={cn('flex items-center', className)}>
      {avatars.slice(0, maxVisible).map((avatar, i) => (
        <div key={i} className="-ml-2 relative z-10 first:ml-0">
          <Avatar src={typeof avatar === 'string' ? avatar : undefined} size={size} />
        </div>
      ))}
      {hiddenCount > 0 && (
        <div className="-ml-2 relative z-10">
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-gray-100 text-gray-500 text-xs font-medium dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400',
            sizeMap[size]
          )}>
            +{hiddenCount}
          </div>
        </div>
      )}
    </div>
  );
}