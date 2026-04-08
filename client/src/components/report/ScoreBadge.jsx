import React from 'react';
import { getScoreBand } from '../../lib/utils.js';
import { cn } from '../../lib/utils.js';

export default function ScoreBadge({ score, size = 'md' }) {
  const band = getScoreBand(score);
  const colorMap = {
    success: { ring: 'stroke-success', text: 'text-success', bg: 'bg-green-50' },
    warning: { ring: 'stroke-warning', text: 'text-warning', bg: 'bg-yellow-50' },
    orange: { ring: 'stroke-orange-500', text: 'text-orange-600', bg: 'bg-orange-50' },
    danger: { ring: 'stroke-danger', text: 'text-danger', bg: 'bg-red-50' },
  };
  const colors = colorMap[band.color] || colorMap.danger;

  if (size === 'sm') {
    return (
      <span className={cn('badge font-bold', colors.bg, colors.text)}>
        {score}/100 · {band.label}
      </span>
    );
  }

  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="100" height="100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E2DC" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r} fill="none"
            className={colors.ring}
            strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl font-bold', colors.text)}>{score}</span>
          <span className="text-xs text-muted">/ 100</span>
        </div>
      </div>
      <span className={cn('badge text-sm px-3 py-1', colors.bg, colors.text)}>{band.label}</span>
    </div>
  );
}
