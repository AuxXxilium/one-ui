import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { TILE } from './Card';
import { Icon } from '../icons';

// A small live reading pinned to the bottom-right corner, from Firevisor's host
// widget: dials for shares of a whole (CPU, memory, storage), tiles of paired
// rates (network down and up, disk read and write), a bar per volume, and one
// figure in the title bar - the hottest sensor, say. Closed it is a single
// button; whether it is open is remembered.
//
// It only draws. The app fetches and passes the numbers in, and should fetch
// only while the widget is open (onOpenChange says when) and the page is on
// screen: useVisiblePoll does both. A monitor should not cost the machine it
// watches.
//
// A .panel like every other box, so it is solid or glass with the rest of the
// app - or glass on its own with `glass`. Its tracks and chips are tints rather
// than greys of their own, so under glass they do not lay solid bars across it.

// A transfer rate in the unit that suits it, spelled out with its /s: "263 B"
// beside "387 B" reads as an amount, and "4M" and "4K" differ by a thousand
// in one character. Below a kilobyte it stays in bytes rather than rounding to
// a "0.4 KB/s" that looks like nothing.
export const formatRate = (bytesPerSec) => {
  if (!bytesPerSec || bytesPerSec < 1) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let v = bytesPerSec;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
};

export const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
};

// Green below 70, amber to 90, red above, on every dial and bar. Status
// colours rather than the accent: an accent-coloured dial reads as healthy at
// 95%.
const level = (pct) => (pct >= 90 ? 'red' : pct >= 70 ? 'amber' : 'green');
const FILL = { green: 'bg-green-500', amber: 'bg-amber-500', red: 'bg-red-500' };
const STROKE = { green: 'text-green-500', amber: 'text-amber-500', red: 'text-red-500' };

const clamp = (pct) => Math.max(0, Math.min(100, Number(pct) || 0));

const RING_R = 22;
const RING_C = 2 * Math.PI * RING_R;

// A dial: a share of a fixed whole is what a ring says at a glance, and three
// of them sit side by side where three bars would stack.
const Ring = ({ pct, label, value }) => {
  const p = clamp(pct);
  return (
    <div className="flex flex-col items-center min-w-0">
      <div className="relative w-14 h-14">
        {/* Turned so the arc starts at twelve o'clock, the way a dial is read.
            Kebab-case attributes: plain Preact without compat hands SVG props
            to setAttribute as spelled, and strokeWidth is not one SVG knows. */}
        <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90" aria-hidden="true">
          <circle cx="28" cy="28" r={RING_R} fill="none" stroke-width="5"
                  className="stroke-black/10 dark:stroke-white/10" />
          <circle cx="28" cy="28" r={RING_R} fill="none" stroke-width="5" stroke-linecap="round"
                  stroke="currentColor"
                  stroke-dasharray={RING_C}
                  stroke-dashoffset={RING_C * (1 - p / 100)}
                  className={`${STROKE[level(p)]} transition-[stroke-dashoffset] duration-500`} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums text-gray-700 dark:text-gray-200">
          {value ?? `${Math.round(p)}%`}
        </span>
      </div>
      <span className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-full">{label}</span>
    </div>
  );
};

const Track = ({ children, thin }) => (
  <div className={`${thin ? 'h-1' : 'h-1.5'} w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden`}>
    {children}
  </div>
);

// Two rates in one tile, each with its own bar. A rate has no full scale -
// nothing here knows whether the link is 1 Gb or 25 - so both bars are drawn
// against the largest rate the pair has shown since the widget opened: "is
// this a lot, for this machine". One scale for the pair, so 400 B/s beside
// 40 KB/s reads as the small figure it is. A real but tiny rate keeps a 2%
// sliver; a true zero draws nothing.
const RatePair = ({ label, items, peak }) => {
  const width = (v) => (v > 0 && peak > 0 ? Math.max(2, Math.min(100, (v / peak) * 100)) : 0);
  return (
    <div className={`${TILE} min-w-0 px-2.5 py-2`}>
      <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</div>
      {items.map((it) => (
        <div key={it.key} className="mt-1.5">
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0">{it.key}</span>
            <span className="text-[11px] tabular-nums text-gray-600 dark:text-gray-300 truncate">
              {it.text ?? (it.value == null ? '—' : formatRate(it.value))}
            </span>
          </div>
          <div className="mt-0.5">
            <Track thin>
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${it.tone || 'bg-blue-500'}`}
                style={{ width: `${width(it.value)}%` }}
              />
            </Track>
          </div>
        </div>
      ))}
    </div>
  );
};

const readStored = (key) => {
  if (!key) return undefined;
  try {
    const v = localStorage.getItem(key);
    return v === null ? undefined : v === '1';
  } catch (e) {
    return undefined;
  }
};

const StatsWidget = ({
  title = 'Host',
  badge,
  rings = [],
  rates = [],
  bars = [],
  loading = false,
  error,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  storageKey,
  glass = false,
  className = 'fixed bottom-4 right-4 z-40',
}) => {
  // Open or not: the caller's, when it passes `open`; otherwise kept here,
  // closed by default and remembered under storageKey - a widget that reopens
  // itself on every load is one people close for good.
  const [openState, setOpenState] = useState(() => readStored(storageKey) ?? defaultOpen);
  const open = openProp ?? openState;

  const setOpen = (next) => {
    setOpenState(next);
    if (storageKey) {
      try { localStorage.setItem(storageKey, next ? '1' : '0'); } catch (e) { /* not remembered */ }
    }
    if (onOpenChange) onOpenChange(next);
  };

  // The largest rate each pair has shown, for its bars to be a share of. A ref:
  // it is read in the same render that raises it. It only rises while open - a
  // peak that decayed would turn a quiet machine busy-looking - and starts over
  // each time the widget opens.
  const peaks = useRef({});
  useEffect(() => { if (!open) peaks.current = {}; }, [open]);

  const surface = `panel ${glass ? 'panel-glass' : ''} ring-1 ring-black/5 dark:ring-white/10`;

  if (!open) {
    // The hover marks the glyph rather than the box: under glass the box's
    // own background is beneath the glass layer and would not show.
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Show ${title} statistics`}
        aria-label={`Show ${title} statistics`}
        className={`${className} h-11 w-11 rounded-2xl shadow-lg ${surface} flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
      >
        <Icon icon="trend" size={18} />
      </button>
    );
  }

  rates.forEach((r) => {
    const top = Math.max(0, ...r.items.map((it) => Number(it.value) || 0));
    peaks.current[r.label] = Math.max(peaks.current[r.label] || 0, top);
  });

  const showing = !loading && !error;

  return (
    <div className={`${className} w-72 rounded-2xl shadow-xl ${surface}`} role="region" aria-label={`${title} statistics`}>
      <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-1">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</span>
        <div className="flex items-center gap-2">
          {showing && badge && (
            <span
              className="text-[11px] tabular-nums px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300"
              title={badge.title}
            >
              {badge.text}
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Hide"
            aria-label={`Hide ${title} statistics`}
            className="p-0.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Icon icon="close" size={16} />
          </button>
        </div>
      </div>

      <div className="px-3.5 pb-3.5 pt-1">
        {loading && !error && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Reading…</p>
        )}
        {error && (
          <p className="text-[11px] text-red-600 dark:text-red-400">
            {typeof error === 'string' ? error : 'No answer.'}
          </p>
        )}

        {showing && (
          <Fragment>
            {rings.length > 0 && (
              <div className={`grid gap-2 py-1 ${rings.length >= 3 ? 'grid-cols-3' : rings.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {rings.slice(0, 3).map((r) => <Ring key={r.label} {...r} />)}
              </div>
            )}

            {rates.length > 0 && (
              <div className={`mt-2 grid gap-2 ${rates.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {rates.map((r) => <RatePair key={r.label} {...r} peak={peaks.current[r.label]} />)}
              </div>
            )}

            {bars.length > 0 && (
              <div className="mt-3">
                {bars.map((b) => {
                  const p = clamp(b.pct);
                  return (
                    <div key={b.label} className="mt-2 first:mt-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] font-medium truncate text-gray-600 dark:text-gray-300" title={b.title || b.label}>
                          {b.label}
                        </span>
                        {b.detail && (
                          <span className="text-[11px] tabular-nums text-gray-500 dark:text-gray-400 shrink-0">{b.detail}</span>
                        )}
                      </div>
                      <Track>
                        <div
                          className={`h-full rounded-full transition-[width] duration-500 ${FILL[level(p)]}`}
                          style={{ width: `${p}%` }}
                        />
                      </Track>
                    </div>
                  );
                })}
              </div>
            )}
          </Fragment>
        )}
      </div>
    </div>
  );
};

export default StatsWidget;
