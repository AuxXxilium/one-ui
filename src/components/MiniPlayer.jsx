import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { subscribeMedia, closePlayer, stepPlayer } from '../media';
import { Icon } from '../icons';

// Music (media.js) in a small player docked at the bottom left, on the
// clearer glass of a menu. It belongs to the app, not to the page that
// started it, so it keeps playing while people go on to other pages; the
// next piece of the queue follows by itself. From Firevisor.
//
// AppShell draws one already, beside its sidebar so the credit at the
// sidebar's foot stays in view. An app with its own frame puts <MiniPlayer />
// in once, anywhere, with `className` to move it off the left edge
// (md:left-72, say). `text` replaces its words: { player, of, previous, play,
// pause, next, close, position }, where `of` is a function (i, n) => '2 of 9'.
const WORDS = {
  player: 'Music player',
  of: (i, n) => `${i} of ${n}`,
  previous: 'Previous',
  play: 'Play',
  pause: 'Pause',
  next: 'Next',
  close: 'Close',
  position: 'Position',
};

const clock = (s) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

// The quiet round buttons, tinted on hover so under glass they lay no grey.
const SMALL = 'w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors';

const MiniPlayer = ({ text, className = '' }) => {
  const w = { ...WORDS, ...text };
  const [player, setPlayer] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const audio = useRef(null);
  useEffect(() => subscribeMedia((s) => setPlayer(s.player)), []);

  const it = player ? player.queue[player.index] : null;
  // A new piece: from its start, playing. `started` also restarts a piece
  // asked for again.
  useEffect(() => {
    const a = audio.current;
    if (!a || !it) return;
    setPos(0);
    setDur(0);
    a.src = it.url;
    a.play().catch(() => setPlaying(false));
  }, [it && it.url, player && player.started]);

  if (!player || !it) return null;
  const n = player.queue.length;
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };

  return (
    <div
      // On a phone it leaves room for AppShell's round menu button on the right.
      className={`fixed left-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 w-[min(24rem,calc(100vw-6.5rem))] md:w-[min(24rem,calc(100vw-2rem))] rounded-2xl shadow-xl panel panel-menu ring-1 ring-black/5 dark:ring-white/10 p-3 transition-[left] duration-300 ${className}`}
      role="region"
      aria-label={w.player}
    >
      <audio
        ref={audio}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        // A stream can learn its length only later.
        onDurationChange={(e) => setDur(e.currentTarget.duration)}
        onEnded={() => { if (player.index + 1 < n) stepPlayer(1); else setPlaying(false); }}
      />
      <div className="flex items-center gap-2">
        <span className="w-10 h-10 shrink-0 rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-1">
          <Icon icon="music" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-gray-900 dark:text-white" title={it.name}>{it.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 tabular-nums truncate">
            {clock(pos)} / {clock(dur)}
            {n > 1 && ` · ${w.of(player.index + 1, n)}`}
          </div>
        </div>
        <button type="button" className={SMALL} onClick={() => stepPlayer(-1)} disabled={player.index === 0} title={w.previous} aria-label={w.previous}>
          <Icon icon="chevronLeft" size={16} />
        </button>
        <button
          type="button"
          onClick={toggle}
          title={playing ? w.pause : w.play}
          aria-label={playing ? w.pause : w.play}
          className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-on-accent shadow-sm transition-colors"
        >
          <Icon icon={playing ? 'pause' : 'start'} size={16} />
        </button>
        <button type="button" className={SMALL} onClick={() => stepPlayer(1)} disabled={player.index + 1 >= n} title={w.next} aria-label={w.next}>
          <Icon icon="chevronRight" size={16} />
        </button>
        <button type="button" className={SMALL} onClick={() => { if (audio.current) audio.current.pause(); closePlayer(); }} title={w.close} aria-label={w.close}>
          <Icon icon="close" size={16} />
        </button>
      </div>
      <input
        type="range"
        className="mt-2 w-full h-1.5"
        min={0}
        max={dur || 0}
        step="any"
        value={pos}
        aria-label={w.position}
        onInput={(e) => {
          const v = Number(e.currentTarget.value);
          if (audio.current) audio.current.currentTime = v;
          setPos(v);
        }}
      />
    </div>
  );
};

export default MiniPlayer;
