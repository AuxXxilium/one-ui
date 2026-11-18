import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import Button from './Button';
import { Icon } from '../icons';

// The whole page while the machine behind the app restarts or shuts down.
// The confirmation is the caller's (a Modal); this is what comes after it.
//
//   {restarting && <RestartScreen kind="restart" name="The server" />}
//
// A restart is followed by asking the server every few seconds: first it
// stops answering (it went down), then it answers again (it is back), and
// only then is the page reloaded - a reload while it still answers would only
// show the old version on its way out. Still answering after two minutes is a
// restart that did not happen; not back after ten, one that came up somewhere
// else or not at all. Either way Reload is offered and the watch goes on.
// A shutdown waits only for the server to stop answering: nothing comes back.
//
//   kind       'restart' (default) or 'shutdown'
//   name       what is restarting, for the words: "The server"
//   check      async () => true while the server answers. By default the
//              page's own address is fetched, uncached, with a 4 s limit.
//   onBack     what to do once it is back; reloads the page by default
//   text       other words: { restarting, back, late, notRestarted, shuttingDown,
//              off, waiting, waitingBack, reloading, slow, stillAnswering,
//              shutdownHint, offHint, reload }, each a string or
//              (name) => string
const TEXT = {
  restarting: (n) => `${n} is restarting…`,
  back: (n) => `${n} is back`,
  late: (n) => `${n} has not answered yet`,
  notRestarted: (n) => `${n} has not restarted`,
  shuttingDown: (n) => `${n} is shutting down…`,
  off: (n) => `${n} is off`,
  waiting: 'This page waits and reloads by itself.',
  waitingBack: 'Waiting for it to come back…',
  reloading: 'Loading the page again…',
  slow: 'It may only be slow. Reload once it is up.',
  stillAnswering: 'It is still answering. Reload to see what happened.',
  shutdownHint: 'This page stops responding.',
  offHint: 'To use it again, switch it on.',
  reload: 'Reload',
};

const pageAnswers = async () => {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch(`${window.location.pathname}?alive=${Date.now()}`, { cache: 'no-store', signal: ctl.signal });
    return r.ok;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

const RestartScreen = ({
  kind = 'restart', name = 'The server', check = pageAnswers, onBack = () => window.location.reload(), text,
}) => {
  const w = { ...TEXT, ...text };
  const say = (k) => (typeof w[k] === 'function' ? w[k](name) : w[k]);
  const [down, setDown] = useState(false);
  const [back, setBack] = useState(false);
  const [late, setLate] = useState(false);

  useEffect(() => {
    const started = Date.now();
    let gone = false;
    let wentDown = false;
    let timer = null;
    const tick = async () => {
      if (gone) return;
      const up = await check();
      if (gone) return;
      if (!up && !wentDown) { wentDown = true; setDown(true); }
      if (up && wentDown && kind !== 'shutdown') {
        setBack(true);
        timer = setTimeout(onBack, 2500);
        return;
      }
      if (!up && kind === 'shutdown') return; // off; nothing more to wait for
      const waited = Date.now() - started;
      if ((!wentDown && waited > 2 * 60 * 1000) || waited > 10 * 60 * 1000) setLate(true);
      timer = setTimeout(tick, 3000);
    };
    timer = setTimeout(tick, 2000);
    return () => { gone = true; clearTimeout(timer); };
  }, [kind]);

  const shutdown = kind === 'shutdown';
  const off = shutdown && down;
  const state = back || off ? 'done' : late ? 'late' : 'waiting';
  const headline = shutdown
    ? say(off ? 'off' : 'shuttingDown')
    : say(back ? 'back' : late ? (down ? 'late' : 'notRestarted') : 'restarting');
  const sub = shutdown
    ? say(off ? 'offHint' : 'shutdownHint')
    : say(back ? 'reloading' : late ? (down ? 'slow' : 'stillAnswering') : down ? 'waitingBack' : 'waiting');

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="alertdialog" aria-live="assertive" aria-label={headline}>
      {/* Solid whatever the surface: glass over the dark backdrop came out
          a muddy grey. */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 w-full max-w-md p-8 text-center">
        <div className={`mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center ${
          state === 'done'
            ? (shutdown ? 'bg-gray-500/15 text-gray-500' : 'bg-green-500/15 text-green-600 dark:text-green-400')
            : state === 'late' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
        }`}>
          {state === 'done'
            ? <Icon icon={shutdown ? 'power' : 'check'} size={30} />
            : state === 'late'
              ? <Icon icon="warning" size={30} />
              : <span className="w-9 h-9 rounded-full border-4 border-current border-t-transparent animate-spin" />}
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{headline}</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{sub}</p>
        {(state === 'late' || (state === 'done' && !shutdown)) && (
          <div className="mt-6 flex justify-center">
            <Button icon="refresh" onClick={() => window.location.reload()}>{w.reload}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestartScreen;
