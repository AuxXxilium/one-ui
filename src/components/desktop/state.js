// The desktop's state that outlives a reload: the open windows, their places
// and stacking order, where each page was last closed, the desktop's icons,
// the taskbar's pinned apps and the desktop menu's View choices.
//
// Per browser, in localStorage: how one person arranges their screen, not
// worth a round trip, and it should not follow an account onto a screen of
// another size. An app with sign-in passes a key per user. Every read is
// guarded - storage throws in a private window - and every value is checked
// for shape, so a hand-edited or half-written entry gives the defaults
// rather than a blank page.

// The data type of a dragged app - a desktop icon, a launcher tile - so the
// desktop takes only those and nothing else dropped on it.
export const APP_MIME = 'application/x-oneui-app';

export const SNAPS = ['max', 'left', 'right', 'tl', 'tr', 'bl', 'br'];
export const ICON_SIZES = ['sm', 'md', 'lg'];

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const cleanWin = (w) => {
  if (!w || typeof w.id !== 'string') return null;
  const x = num(w.x);
  const y = num(w.y);
  const wd = num(w.w);
  const ht = num(w.h);
  if (x === null || y === null || wd === null || ht === null) return null;
  const out = { id: w.id, x, y, w: wd, h: ht, min: !!w.min };
  if (SNAPS.indexOf(w.snap) !== -1) out.snap = w.snap;
  return out;
};

const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : null);

//   pinned       apps kept on the taskbar while closed
//   names        a desktop icon's own label, given by Rename
//   iconSize     the desktop menu's View: sm, md, lg
//   hideIcons    the icons hidden
//   pinnedNames  a pinned app that is not open shows its name beside its icon
//   autoArrange  the icons flow in columns in shortcut order; off, each sits
//                in the grid cell it was put in, iconPos { id: {c, r} }
export const emptyDesktop = (shortcuts) => ({
  wins: [],
  stack: [],
  shortcuts: shortcuts.slice(),
  geo: {},
  pinned: [],
  names: {},
  iconSize: 'md',
  hideIcons: false,
  pinnedNames: true,
  autoArrange: true,
  iconPos: {},
});

export const readDesktop = (key, shortcuts) => {
  const empty = emptyDesktop(shortcuts);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return empty;
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object') return empty;
    const wins = Array.isArray(s.wins) ? s.wins.map(cleanWin).filter(Boolean) : [];
    const ids = wins.map((w) => w.id);
    const stack = (strings(s.stack) || []).filter((id) => ids.indexOf(id) !== -1);
    ids.forEach((id) => { if (stack.indexOf(id) === -1) stack.push(id); });
    const geo = {};
    if (s.geo && typeof s.geo === 'object') {
      Object.keys(s.geo).forEach((k) => {
        const g = cleanWin({ id: k, ...s.geo[k] });
        if (g) geo[k] = { x: g.x, y: g.y, w: g.w, h: g.h };
      });
    }
    const names = {};
    if (s.names && typeof s.names === 'object') {
      Object.keys(s.names).forEach((k) => {
        if (typeof s.names[k] === 'string' && s.names[k].trim()) names[k] = s.names[k].slice(0, 40);
      });
    }
    const iconPos = {};
    if (s.iconPos && typeof s.iconPos === 'object') {
      Object.keys(s.iconPos).forEach((k) => {
        const v = s.iconPos[k];
        if (v && Number.isInteger(v.c) && Number.isInteger(v.r) && v.c >= 0 && v.r >= 0 && v.c < 200 && v.r < 200) {
          iconPos[k] = { c: v.c, r: v.r };
        }
      });
    }
    return {
      wins,
      stack,
      shortcuts: strings(s.shortcuts) || empty.shortcuts,
      geo,
      pinned: strings(s.pinned) || [],
      names,
      iconSize: ICON_SIZES.indexOf(s.iconSize) !== -1 ? s.iconSize : 'md',
      hideIcons: !!s.hideIcons,
      pinnedNames: s.pinnedNames !== false,
      autoArrange: s.autoArrange !== false,
      iconPos,
    };
  } catch (e) {
    return empty;
  }
};

export const writeDesktop = (key, state) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      wins: state.wins.map(({ id, x, y, w, h, min, snap }) => ({ id, x, y, w, h, min, snap })),
      stack: state.stack,
      shortcuts: state.shortcuts,
      geo: state.geo,
      pinned: state.pinned,
      names: state.names,
      iconSize: state.iconSize,
      hideIcons: state.hideIcons,
      pinnedNames: state.pinnedNames,
      autoArrange: state.autoArrange,
      iconPos: state.iconPos,
    }));
  } catch (e) { /* forgotten at the next reload, nothing else */ }
};
