// A lightbox for pictures and videos and a small music player, for any page
// that lists files. From Firevisor's Storage and Drive.
//
// An item: { name, url, kind: 'image' | 'video' | 'audio', download? }.
//
//   openMedia(items, index)   pictures and videos open in the lightbox
//                             (MediaViewer); music in the player docked at
//                             the bottom left (MiniPlayer), which keeps
//                             playing while people go on to other pages
//   closeViewer(), closePlayer(), stepViewer(±1), stepPlayer(±1)
//   subscribeMedia(fn)        -> unsubscribe; fn gets { viewer, player }
//   mediaKindOf(name)         'image', 'video', 'audio' or null, by the name
//
// The list may mix every kind, as a folder does: the picture asked for opens
// with the folder's other pictures and videos beside it, a piece of music
// with the folder's other music queued after it.

let state = { viewer: null, player: null };
const subs = new Set();
const emit = () => subs.forEach((fn) => fn(state));
const set = (patch) => { state = { ...state, ...patch }; emit(); };

const KINDS = new Set(['image', 'video', 'audio']);

export const openMedia = (items, index = 0) => {
  const all = items || [];
  const asked = all[Math.min(Math.max(0, index), all.length - 1)];
  const list = all.filter((x) => x && x.url && KINDS.has(x.kind));
  if (!list.length) return;
  // The one asked for, or the first that can be shown if it cannot.
  const it = list.includes(asked) ? asked : list[0];
  if (it.kind === 'audio') {
    const queue = list.filter((x) => x.kind === 'audio');
    set({ player: { queue, index: queue.indexOf(it), started: Date.now() } });
  } else {
    const shown = list.filter((x) => x.kind !== 'audio');
    set({ viewer: { items: shown, index: shown.indexOf(it) } });
  }
};

export const stepViewer = (d) => {
  const v = state.viewer;
  if (!v || v.items.length < 2) return;
  set({ viewer: { ...v, index: (v.index + d + v.items.length) % v.items.length } });
};

export const stepPlayer = (d) => {
  const p = state.player;
  if (!p) return;
  const next = p.index + d;
  if (next < 0 || next >= p.queue.length) return;
  set({ player: { ...p, index: next, started: Date.now() } });
};

export const closeViewer = () => set({ viewer: null });
export const closePlayer = () => set({ player: null });

export const subscribeMedia = (fn) => {
  subs.add(fn);
  fn(state);
  return () => subs.delete(fn);
};

export const mediaKindOf = (name) => {
  const n = String(name || '').toLowerCase();
  if (/\.(jpe?g|png|gif|webp|avif|bmp|svg)$/.test(n)) return 'image';
  if (/\.(mp4|m4v|webm|mkv|mov|ogv)$/.test(n)) return 'video';
  if (/\.(mp3|m4a|aac|flac|wav|ogg|oga|opus)$/.test(n)) return 'audio';
  return null;
};
