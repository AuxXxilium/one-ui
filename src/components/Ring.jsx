import { h } from 'preact';

// A share of a fixed whole, as a dial: CPU, memory, a disk, a quota. The
// same dial StatsWidget draws, on its own, so a ring looks the same wherever
// it is. From Firevisor.
//
// Green below 70, amber to 90, red above: status colours rather than the
// accent, since an accent-coloured dial reads as healthy at 95%. `tone`
// overrides it where a high figure is no warning - cores handed out past the
// host's threads are normal.
//
// `pct` may be null for a figure the source does not publish: the track is
// drawn empty and the value is a dash, never 0 - "idle" and "not measured"
// are different facts. Above 100 the arc is full and the value says how far.
//
//   pct, label, value (the text inside; pct with a % by default), sub (a
//   second line under the label), title, tone (a text- colour), size (px)
export const ringTone = (pct) => {
  if (pct >= 90) return 'text-red-500';
  if (pct >= 70) return 'text-amber-500';
  return 'text-green-500';
};

const R = 22;
const C = 2 * Math.PI * R;

const Ring = ({ pct, label, value, sub, title, tone, size = 56 }) => {
  const known = pct !== null && pct !== undefined && !Number.isNaN(Number(pct));
  const clamped = known ? Math.max(0, Math.min(100, Number(pct))) : 0;
  const shown = value !== undefined ? value : known ? `${Math.round(Number(pct))}%` : '—';
  return (
    <div className="flex flex-col items-center min-w-0" title={title}>
      <div className="relative shrink-0" style={{ width: `${size}px`, height: `${size}px` }}>
        {/* Turned so the arc starts at twelve o'clock, the way a dial is read.
            Kebab-case attributes: plain Preact without compat hands SVG props
            to setAttribute as spelled, and strokeWidth is not one SVG knows.
            The track is a tint, so under glass it lays no solid ring. */}
        <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="28" cy="28" r={R} fill="none" stroke-width="5" className="stroke-black/10 dark:stroke-white/10" />
          {known && (
            <circle
              cx="28" cy="28" r={R} fill="none" stroke-width="5" stroke-linecap="round"
              stroke="currentColor"
              stroke-dasharray={C}
              stroke-dashoffset={C * (1 - clamped / 100)}
              className={`${tone || ringTone(Number(pct))} transition-[stroke-dashoffset] duration-500`}
            />
          )}
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-semibold tabular-nums text-gray-700 dark:text-gray-200 ${
          size >= 64 ? 'text-xs' : 'text-[11px]'}`}>
          {shown}
        </span>
      </div>
      {label && <span className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-full">{label}</span>}
      {sub && <span className="text-[11px] font-mono text-gray-700 dark:text-gray-300 truncate max-w-full">{sub}</span>}
    </div>
  );
};

export default Ring;
