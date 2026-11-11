import { h, Fragment } from 'preact';
import { useState, useEffect, useRef, useLayoutEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { Icon } from '../icons';
import { inputClass } from '../styles';

// A time field in the One UI look, in place of the browser's own: a button
// styled as a field that opens a floating menu panel (panel panel-menu, so it
// turns clear glass with the rest), or a sheet from the bottom edge on a
// phone. In it, hour and minute are wheels to spin, like the reels of a slot
// machine.

const phone = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 639px)').matches;
const pad = (n) => String(n).padStart(2, '0');
const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// The floating panel, rendered into <body> so no card or dialog clips it.
// Placed under the field, or above it when there is no room below; kept on
// screen; follows the page as it scrolls.
const Popover = ({ anchor, open, onClose, children, width = 288 }) => {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      if (!anchor.current) return;
      if (phone()) { setPos({ sheet: true }); return; }
      const r = anchor.current.getBoundingClientRect();
      const height = ref.current ? ref.current.offsetHeight : 320;
      const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
      const below = r.bottom + 6;
      const top = below + height > window.innerHeight - 8 && r.top - height - 6 > 8 ? r.top - height - 6 : below;
      setPos({ top, left });
    };
    place();
    const raf = requestAnimationFrame(place);
    // Scrolling the page moves it along; scrolling inside it (the wheels)
    // does not.
    const onScroll = (e) => { if (!(ref.current && e.target instanceof Node && ref.current.contains(e.target))) place(); };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, anchor, width]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      if (anchor.current && anchor.current.contains(e.target)) return;
      onClose();
    };
    // Escape closes the picker only, not a dialog it sits in.
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, onClose, anchor]);

  if (!open) return null;
  const sheet = pos && pos.sheet;
  return createPortal(
    <Fragment>
      {sheet && <div className="fixed inset-0 z-[69] bg-black/30" />}
      <div
        ref={ref}
        role="dialog"
        className={`panel panel-menu fixed z-[70] shadow-xl ring-1 ring-black/5 dark:ring-white/10 text-gray-900 dark:text-gray-100 ${
          sheet ? 'left-0 right-0 bottom-0 rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]' : 'rounded-2xl p-3'
        }`}
        style={sheet ? {} : { top: pos ? pos.top : -9999, left: pos ? pos.left : -9999, width }}
      >
        {children}
      </div>
    </Fragment>,
    document.body,
  );
};

const ROW = 40; // px per value
const VISIBLE = 5; // values in view; the middle one is chosen
const COPIES = 5; // the values repeated, so the wheel can spin round

// A wheel to spin: it runs round endlessly (after 23 comes 00 again), snaps
// to a value and turns slightly away at the top and bottom. Swipe, scroll
// with the mouse wheel, tap a value or use the arrow keys.
const Wheel = ({ count, step = 1, value, fallback, onPick, label }) => {
  const ref = useRef(null);
  const [top, setTop] = useState(0);
  const timer = useRef(null);
  const last = useRef(null);
  const base = Math.floor(COPIES / 2) * count;
  const wrap = (i) => ((i % count) + count) % count;

  // Start on the value, in the middle copy.
  useLayoutEffect(() => {
    const t = (base + (value ?? fallback)) * ROW;
    ref.current.scrollTop = t;
    setTop(t);
    last.current = value ?? fallback;
  }, []);
  // A value set from outside (typed, Now): spin there.
  useEffect(() => {
    const el = ref.current;
    if (value == null || wrap(Math.round(el.scrollTop / ROW)) === value) return;
    el.scrollTo({ top: (base + value) * ROW, behavior: 'smooth' });
  }, [value]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onScroll = () => {
    const el = ref.current;
    setTop(el.scrollTop);
    const v = wrap(Math.round(el.scrollTop / ROW));
    if (last.current !== v) {
      last.current = v;
      if (navigator.vibrate) navigator.vibrate(4); // a click per value, on phones that can
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const i = Math.round(el.scrollTop / ROW);
      const v2 = wrap(i);
      // Back into the middle copy, unseen, so it can spin on either way.
      if (i !== base + v2) el.scrollTop = (base + v2) * ROW;
      if (v2 !== value) onPick(v2);
    }, 150);
  };

  const items = [];
  for (let i = 0; i < count * COPIES; i++) {
    const d = (i * ROW - top) / ROW; // rows from the middle
    const a = Math.min(Math.abs(d), 3);
    items.push(
      <div
        key={i}
        onClick={() => ref.current.scrollTo({ top: i * ROW, behavior: 'smooth' })}
        className={`snap-center flex items-center justify-center tabular-nums cursor-pointer select-none ${a < 0.5 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
        style={{ height: `${ROW}px`, fontSize: a < 0.5 ? '22px' : '19px', opacity: 1 - a * 0.27, transform: `rotateX(${Math.max(-60, Math.min(60, -d * 20))}deg)` }}
      >
        {pad(wrap(i) * step)}
      </div>,
    );
  }
  return (
    <div className="relative flex-1">
      <div className="text-[11px] font-medium text-center text-gray-400 dark:text-gray-500 mb-1">{label}</div>
      <div className="relative">
        {/* The window of the reel: the chosen value. */}
        <div className="absolute inset-x-0 rounded-xl bg-blue-500/10 ring-1 ring-blue-500/40 pointer-events-none" style={{ top: `${2 * ROW}px`, height: `${ROW}px` }} />
        <div
          ref={ref}
          onScroll={onScroll}
          role="listbox"
          aria-label={label}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); ref.current.scrollBy({ top: e.key === 'ArrowDown' ? ROW : -ROW, behavior: 'smooth' }); }
          }}
          className="no-scrollbar overflow-y-scroll snap-y snap-mandatory overscroll-contain outline-none"
          style={{
            height: `${ROW * VISIBLE}px`,
            perspective: '600px',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
            maskImage: 'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
          }}
        >
          <div style={{ height: `${2 * ROW}px` }} />
          {items}
          <div style={{ height: `${2 * ROW}px` }} />
        </div>
      </div>
    </div>
  );
};

const footBtn = 'px-2.5 py-1 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-black/5 dark:hover:bg-white/10';

// The words it shows, for an app in another language to replace.
const TEXT = { hour: 'Hour', minute: 'Minute', now: 'Now', clear: 'Clear', done: 'Done', type: 'Type a time' };

// A time of day, 'HH:MM' (24 hours), or '' for none.
//
//   value, onChange   the time, and what to do with a new one
//   step              minutes per step of the minute wheel: 1, 5 (default),
//                     10, 15, 20 or 30
//   start             the time the wheels show while there is none ('07:00')
//   clearable         a Clear button while a time is set (on by default)
//   placeholder, disabled, className, label (the field's name for screen
//   readers), text    the words in the picker ({ hour, minute, now, clear,
//                     done, type }), in English unless given
//
// Typing works too: 730, 7:30, 07.30 or 7 (07:00), then Enter.
const TimePicker = ({ value, onChange, step = 5, start = '07:00', placeholder = '--:--', clearable = true, disabled, className = '', label = 'Time', text }) => {
  const t = { ...TEXT, ...text };
  const minuteStep = 60 % step === 0 && step > 0 ? step : 5;
  const anchor = useRef(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [curH, curM] = value ? value.split(':').map(Number) : [null, null];
  const [startH, startM] = start.split(':').map(Number);

  useEffect(() => { if (open) setTyped(value || ''); }, [open, value]);

  const set = (hh, mm, close) => {
    onChange(`${pad(hh)}:${pad(mm)}`);
    if (close) setOpen(false);
  };
  const applyTyped = () => {
    const v = typed.trim().replace(/[.,]/, ':');
    const mt = /^(\d{1,2})(?::?(\d{2}))?$/.exec(v);
    if (!mt) return;
    const hh = Number(mt[1]);
    const mm = Number(mt[2] || 0);
    if (hh < 24 && mm < 60) set(hh, mm, true);
  };

  return (
    <Fragment>
      <button
        ref={anchor}
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${inputClass} flex items-center justify-between gap-2 text-left disabled:opacity-50 ${className}`}
      >
        <span className={`truncate tabular-nums ${value ? '' : 'text-gray-400 dark:text-gray-500'}`}>{value || placeholder}</span>
        <Icon icon="clock" size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
      </button>
      <Popover anchor={anchor} open={open} onClose={() => setOpen(false)} width={300}>
        <div className="flex items-center gap-2 mb-2">
          <input
            className={`${inputClass} text-center text-base font-semibold tabular-nums`}
            value={typed}
            inputMode="numeric"
            placeholder="HH:MM"
            aria-label={t.type}
            onInput={(e) => setTyped(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyTyped(); } }}
            onBlur={applyTyped}
          />
          <button type="button" className={`${footBtn} whitespace-nowrap`} onClick={() => { const [hh, mm] = nowTime().split(':').map(Number); set(hh, mm, true); }}>{t.now}</button>
        </div>
        <div className="flex items-center gap-1 px-2">
          <Wheel count={24} value={curH} fallback={startH || 0} label={t.hour} onPick={(hh) => set(hh, curM ?? 0, false)} />
          <div className="text-2xl font-semibold pt-5 text-gray-400">:</div>
          <Wheel
            key={minuteStep}
            count={60 / minuteStep}
            step={minuteStep}
            value={curM == null ? null : Math.round(curM / minuteStep) % (60 / minuteStep)}
            fallback={Math.round((startM || 0) / minuteStep) % (60 / minuteStep)}
            label={t.minute}
            onPick={(i) => set(curH ?? (startH || 0), i * minuteStep, false)}
          />
        </div>
        <div className="flex justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/10">
          {clearable && value ? <button type="button" className={footBtn} onClick={() => { onChange(''); setOpen(false); }}>{t.clear}</button> : <span />}
          <button type="button" className={footBtn} onClick={() => setOpen(false)}>{t.done}</button>
        </div>
      </Popover>
    </Fragment>
  );
};

export default TimePicker;
