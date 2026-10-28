import { useEffect, useRef } from 'preact/hooks';

// Poll while the page is on screen, and stop while it is not. From Firevisor,
// where every live view polls the appliance it runs on.
//
//   useVisiblePoll(async () => setStats(await api.stats()), 5000, open, open);
//
// It runs fn at once, then again `intervalMs` after each call has SETTLED - not
// on a fixed schedule, so a slow backend is asked less often rather than
// getting a fresh request on top of the one still running. A hidden page (a
// background tab, a minimised window) is not polled at all, and coming back to
// it polls at once rather than showing what was last fetched.
//
// enabled: false runs the first call and then stops - a view has to show
// something. To not call at all, return early from fn.
// key: what the data depends on - a range, a view, whether a widget is open. A
// new key restarts the poll with an immediate call.
export function useVisiblePoll(fn, intervalMs, enabled = true, key = undefined) {
  // Read on every tick, so an inline arrow over fresh state does not restart
  // the timer on each render.
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const timerRef = useRef(null);
  // Which run is current, checked after every await: a request in flight when
  // the key changes or the view goes cannot schedule another tick.
  const genRef = useRef(0);
  const runningRef = useRef(false);
  const tickRef = useRef(null);
  const rerunRef = useRef(false);

  useEffect(() => {
    const gen = ++genRef.current;
    const live = () => genRef.current === gen;
    const visible = () => typeof document === 'undefined' || !document.hidden;
    const clear = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const tick = async () => {
      if (!live()) return;
      if (runningRef.current) {
        rerunRef.current = true;
        return;
      }
      runningRef.current = true;
      try {
        await fnRef.current();
      } finally {
        runningRef.current = false;
      }
      if (!live()) {
        // Superseded while in flight: the new run starts now if it asked to.
        if (rerunRef.current && tickRef.current) {
          rerunRef.current = false;
          tickRef.current();
        }
        return;
      }
      rerunRef.current = false;
      if (!enabled) return;
      clear();
      // Not rescheduled while hidden; the visibility handler restarts it.
      if (visible()) timerRef.current = setTimeout(tick, intervalMs);
    };
    tickRef.current = tick;

    clear();
    tick();

    const onVisibility = () => {
      if (!live()) return;
      if (document.hidden) {
        clear();
        return;
      }
      if (enabled && !runningRef.current) {
        clear();
        tick();
      }
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (live()) genRef.current += 1;
      clear();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs, enabled, key]);
}

export default useVisiblePoll;
