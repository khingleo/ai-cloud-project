/**
 * MTN ENTERPRISE HUB - PROGRESS BAR COMPONENT
 */

import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  labelPosition?: 'right' | 'top';
  customColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  showLabel = true,
  labelPosition = 'right',
  customColor,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const getHeightClass = () => {
    switch (size) {
      case 'sm':
        return 'h-1.5';
      case 'lg':
        return 'h-3.5';
      default:
        return 'h-2.5';
    }
  };

  const getProgressColor = () => {
    if (customColor) return customColor;
    if (clampedProgress >= 100) return 'bg-emerald-500';
    if (clampedProgress >= 70) return 'bg-mtn-yellow-500';
    if (clampedProgress >= 30) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  return (
    <div className={`w-full ${labelPosition === 'right' ? 'flex items-center gap-3' : 'flex flex-col gap-1.5'}`}>
      {showLabel && labelPosition === 'top' && (
        <div className="flex justify-between text-xs font-semibold text-slate-700">
          <span>Completion Progress</span>
          <span>{clampedProgress}%</span>
        </div>
      )}
      <div className={`flex-1 w-full bg-slate-100 rounded-full overflow-hidden ${getHeightClass()}`}>
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${getProgressColor()}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && labelPosition === 'right' && (
        <span className="text-xs font-bold text-slate-700 w-10 text-right shrink-0">
          {clampedProgress}%
        </span>
      )}
    </div>
  );
};
