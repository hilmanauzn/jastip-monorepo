'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { formatCurrency } from '../utils/cn';

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface SalesChartProps {
  data: ChartDataPoint[];
  height?: number;
  showGrid?: boolean;
  accentColor?: string;
  className?: string;
}

export function SalesChart({
  data,
  height = 200,
  showGrid = true,
  accentColor = 'from-primary-500 to-emerald-400',
  className,
}: SalesChartProps) {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;
  const width = 100;
  const chartHeight = height - 40;
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Calculate points for the line
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * plotWidth;
    const y = padding.top + plotHeight - ((d.value - minValue) / range) * plotHeight;
    return `${x},${y}`;
  }).join(' ');

  // Area fill path
  const areaPath = `M${padding.left},${padding.top + plotHeight} L${points} L${padding.left + plotWidth},${padding.top + plotHeight} Z`;

  // Grid lines
  const gridLines = showGrid
    ? [0.25, 0.5, 0.75].map((ratio) => {
        const y = padding.top + plotHeight - ratio * plotHeight;
        return (
          <line
            key={ratio}
            x1={padding.left}
            y1={y}
            x2={padding.left + plotWidth}
            y2={y}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        );
      })
    : null;

  // Labels
  const firstLabel = data[0].label || data[0].date;
  const lastLabel = data[data.length - 1].label || data[data.length - 1].date;

  return (
    <div className={cn('w-full h-full', className)}>
      <svg
        width={width}
        height={chartHeight}
        viewBox={`0 0 ${width} ${chartHeight}`}
        className="w-full h-full"
        role="img"
        aria-label="Sales trend chart"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>
        
        {gridLines}
        
        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#chartGradient)"
        />
        
        {/* Line */}
        <path
          d={`M${points}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points */}
        {data.map((d, i) => {
          const x = padding.left + (i / (data.length - 1)) * plotWidth;
          const y = padding.top + plotHeight - ((d.value - minValue) / range) * plotHeight;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3}
              fill="currentColor"
              className="transition-all duration-200 hover:r-4 hover:stroke-white hover:stroke-2"
            />
          );
        })}
      </svg>

      {/* Axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{firstLabel}</span>
        <span>{lastLabel}</span>
      </div>

      {/* Value labels */}
      <div className="flex justify-between mt-1 text-xs font-medium text-gray-900 dark:text-white">
        <span>{formatCurrency(maxValue)}</span>
        <span>{formatCurrency(minValue)}</span>
      </div>
    </div>
  );
}

interface MiniChartProps {
  data: number[];
  height?: number;
  color?: string;
  className?: string;
}

export function MiniChart({ data, height = 60, color = 'text-primary-500', className }: MiniChartProps) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;
  const width = 100;
  const plotHeight = height - 10;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = plotHeight - ((d - minValue) / range) * plotHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={cn('relative w-full h-full', className)}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <path
          d={`M${points}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * width;
          const y = plotHeight - ((d - minValue) / range) * plotHeight;
          return (
            <circle key={i} cx={x} cy={y} r={2} fill="currentColor" />
          );
        })}
      </svg>
    </div>
  );
}