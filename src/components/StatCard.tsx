import React from 'react';
import type { HTMLAttributes } from 'react';
import type { Color } from '@/game-logic/types';
import { cn } from '@/lib/utils';
import { PieceColor } from '@/game-logic/rules';

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  color: Color;
  label: string;
  moves: number;
  captures: number;
  isActive?: boolean;
}

const StatCard = React.memo(
  ({ color, label, moves, captures, isActive = false }: StatCardProps) => {
    return (
      <article
        className={cn(
          'w-full relative flex flex-col rounded-3xl px-5 py-3 transition-all duration-300 ease-out',
          'shadow-lg ring-2 ring-black/10',
          color === PieceColor.light
            ? 'bg-gradient-to-br from-red-600 via-red-700 to-red-900  text-orange-100'
            : 'bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100',
          isActive
            ? 'opacity-100 shadow-slate-900 ring-white/80'
            : 'opacity-40 saturate-75 brightness-95',
        )}
        data-active={isActive}
        role="listitem"
        aria-label={`${label} stats`}
        aria-current={isActive ? 'true' : undefined}
      >
        <h2 className="text-md font-normal uppercase text-white/80 tracking-[0.25em]">{label}</h2>
        <dl className="mt-2 flex flex-col">
          <span className="inline-flex items-center gap-2 justify-between">
            <dt className="text-sm font-medium text-white/80">Moves</dt>
            <dd className="text-xl font-bold">{moves}</dd>
          </span>
          <span className="inline-flex items-center gap-2 justify-between ">
            <dt className="text-sm font-medium text-white/80">Captures</dt>
            <dd className="text-xl font-bold">{captures}</dd>
          </span>
        </dl>
      </article>
    );
  },
);

export { StatCard };
