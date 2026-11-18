import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { subscribeMedia, closeViewer, stepViewer } from '../media';
import { Icon } from '../icons';

// Pictures and videos one at a time over the whole screen (media.js): the
// name and "3 of 12" above, the one before and after at the sides, Download
// and Close at the top right. Escape closes, the arrow keys step, a click on
// the dark around the picture closes too. From Firevisor.
//
// AppShell draws one already. An app with its own frame puts <MediaViewer />
// in once, anywhere. `text` replaces its words: { of, download, close,
// previous, next }, where `of` is a function (i, n) => '3 of 12'.
const WORDS = {
  of: (i, n) => `${i} of ${n}`,
  download: 'Download',
  close: 'Close',
  previous: 'Previous',
  next: 'Next',
};

// Round white-on-dark buttons: the page's own colours are under the dark, so
// the controls are the lightbox's own.
const ROUND = 'w-10 h-10 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white transition-colors';

const MediaViewer = ({ text }) => {
  const w = { ...WORDS, ...text };
  const [viewer, setViewer] = useState(null);
  useEffect(() => subscribeMedia((s) => setViewer(s.viewer)), []);

  useEffect(() => {
    if (!viewer) return undefined;
    const onKey = (e) => {
      // Captured and stopped, so a dialog the lightbox was opened from stays
      // open behind it.
      if (e.key === 'Escape') { e.stopPropagation(); closeViewer(); }
      else if (e.key === 'ArrowRight') stepViewer(1);
      else if (e.key === 'ArrowLeft') stepViewer(-1);
    };
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener('keydown', onKey, true);
    };
  }, [!!viewer]);

  if (!viewer) return null;
  const it = viewer.items[viewer.index];
  const many = viewer.items.length > 1;
  const closeOnGround = (e) => { if (e.target === e.currentTarget) closeViewer(); };
  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/90 backdrop-blur-sm select-none"
      role="dialog"
      aria-modal="true"
      aria-label={it.name}
      onClick={closeOnGround}
    >
      <div className="flex items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-white">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{it.name}</div>
          {many && <div className="text-xs text-white/60 tabular-nums">{w.of(viewer.index + 1, viewer.items.length)}</div>}
        </div>
        <a className={ROUND} href={it.download || it.url} download={it.name} title={w.download} aria-label={w.download}>
          <Icon icon="download" size={18} />
        </a>
        <button type="button" className={ROUND} onClick={closeViewer} title={w.close} aria-label={w.close}>
          <Icon icon="close" size={18} />
        </button>
      </div>
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 pb-6 sm:px-20" onClick={closeOnGround}>
        {it.kind === 'video' ? (
          // key: a new video starts from its beginning, not where the last
          // one was.
          <video key={it.url} src={it.url} controls autoPlay playsInline className="max-w-full max-h-full rounded-xl bg-black shadow-2xl" />
        ) : (
          <img key={it.url} src={it.url} alt={it.name} draggable={false} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-[oui-rise-in_160ms_ease-out]" />
        )}
        {many && (
          <button type="button" className={`${ROUND} absolute left-3 top-1/2 -translate-y-1/2 w-11! h-11!`} onClick={() => stepViewer(-1)} title={w.previous} aria-label={w.previous}>
            <Icon icon="chevronLeft" size={22} />
          </button>
        )}
        {many && (
          <button type="button" className={`${ROUND} absolute right-3 top-1/2 -translate-y-1/2 w-11! h-11!`} onClick={() => stepViewer(1)} title={w.next} aria-label={w.next}>
            <Icon icon="chevronRight" size={22} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MediaViewer;
