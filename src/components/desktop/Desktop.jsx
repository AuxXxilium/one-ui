import { h, Fragment } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import Window, { rectOf, clampRect, MIN_W, MIN_H } from './Window';
import Taskbar from './Taskbar';
import ContextMenu from '../ContextMenu';
import { Icon } from '../../icons';
import { wallpapers, wallpaperOf } from '../../wallpapers';
import { readDesktop, writeDesktop, APP_MIME } from './state';

// A desktop: the app's pages - what the sidebar opens one at a time - each in
// a window of its own, several side by side, over a wallpaper, with a taskbar
// across the top and the app's icons on the desktop. One window per page:
// opening a page that is already open brings its window forward, so there is
// never a question of which of two copies is current.
//
//   <Desktop apps={NAV} renderApp={(id, open) => <Page id={id} />} title="My App" logo={…} />
//
// AppShell draws it when its layout is Desktop (useLayout); it can also be an
// app's whole frame on its own.
//
//   apps          the pages: AppShell's nav items, { id, label, icon,
//                 subtitle?, section?, href? }. One with href opens that
//                 address in a new tab from the launcher instead of a window.
//   renderApp     (id, open) => the page; `open(id)` opens another page
//   title, logo   the launcher's button
//   tray          the app's own controls at the right of the taskbar
//   wallpaper     what useWallpaper returns, or a wallpaper object; the soft
//                 wash by default. With useWallpaper the desktop's menu
//                 offers the wallpapers too.
//   storageKey    where the windows, icons and pins are kept
//                 ('oneui_desktop'); one per user in an app with sign-in
//   defaultIcons  the apps on a first desktop; every page by default
//   initialApp    opened on arrival when no window is open
//   onFocusChange (id) the app whose window is in front
//   onHelp        (id) adds a "?" to each window and Help to its menu
//   clock         the taskbar's clock and calendar (on by default);
//                 onClockSettings adds a button there to the app's settings
//   openRef       a ref the desktop puts its open(id) in, for the app
//   footer        a line for the desktop's corner and the launcher's foot:
//                 AppShell puts the One UI credit there
//   text          its words, for an app in another language (see TEXT)
//
// Kept in this browser and back after a reload: the open windows, their
// places and stacking order, where each page was last closed, the icons, the
// pinned apps and the View choices. Alt+Shift+W closes the window in front,
// Alt+Shift+M minimises it, Alt+Shift+D shows the desktop.

const TEXT = {
  apps: 'Apps', search: 'Search apps', results: 'Results', noMatch: 'Nothing called that.',
  showDesktop: 'Show desktop', middleClick: 'middle-click to close', today: 'Today',
  previousMonth: 'Previous month', nextMonth: 'Next month', clockSettings: 'Date and time settings',
  help: 'Help', minimize: 'Minimise', maximize: 'Maximise', restore: 'Restore', close: 'Close',
  open: 'Open', openMax: 'Open maximised', bringFront: 'Bring to front', restoreSize: 'Restore size',
  leftHalf: 'Left half', rightHalf: 'Right half', addDesktop: 'Add to desktop', removeDesktop: 'Remove from desktop',
  pin: 'Pin to taskbar', unpin: 'Unpin from taskbar', rename: 'Rename', ownName: "Use the app's name",
  reload: 'Reload page', pinnedNames: 'Show names of pinned apps', cascade: 'Cascade windows', tile: 'Tile windows',
  view: 'View', large: 'Large icons', medium: 'Medium icons', small: 'Small icons', hideIcons: 'Hide desktop icons',
  showIcons: 'Show desktop icons', arrange: 'Sort and arrange', autoArrange: 'Auto arrange icons', sortName: 'Sort icons by name',
  wallpaper: 'Wallpaper', ownPicture: 'Your own picture…', closeAll: 'Close all windows', newName: 'New name',
};

// The app a drag carries, under APP_MIME, so nothing else dropped on the
// desktop is taken for one. Its id is readable only on the drop.
const dragApp = (e) => {
  const dt = e.dataTransfer;
  if (!dt || !Array.prototype.includes.call(dt.types || [], APP_MIME)) return null;
  return dt.getData(APP_MIME) || 'pending';
};

// The View menu's three icon sizes: a grid cell in rem, and the tile.
const ICON_CELL = { sm: { w: 5.25, h: 5 }, md: { w: 6.5, h: 6.5 }, lg: { w: 8, h: 8 } };
const ICON_SIZE = {
  sm: { tile: 'w-9 h-9', glyph: 18, text: 'text-[11px]', gap: 'gap-1' },
  md: { tile: 'w-12 h-12', glyph: 24, text: 'text-xs', gap: 'gap-1.5' },
  lg: { tile: 'w-16 h-16', glyph: 32, text: 'text-sm', gap: 'gap-2' },
};
const CELL_PAD = 0.75;
const CELL_GAP = 0.25;
const remPx = () => {
  try { return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; } catch (e) { return 16; }
};

// Where each icon sits: { id: {c, r} }. Auto arrange: in columns from the top
// left, in shortcut order. Otherwise each in its own cell while that cell is
// on screen and free; one without, or whose cell is off screen now, takes the
// first free cell, column by column, its own kept for when there is room.
const layoutIcons = (ids, auto, iconPos, cols, rows) => {
  const at = {};
  if (auto) {
    ids.forEach((id, i) => { at[id] = { c: Math.floor(i / rows), r: i % rows }; });
    return at;
  }
  const taken = new Set();
  const key = (c, r) => `${c},${r}`;
  const loose = [];
  ids.forEach((id) => {
    const p = iconPos[id];
    if (p && p.c < cols && p.r < rows && !taken.has(key(p.c, p.r))) {
      at[id] = { c: p.c, r: p.r };
      taken.add(key(p.c, p.r));
    } else loose.push(id);
  });
  let n = 0;
  loose.forEach((id) => {
    while (taken.has(key(Math.floor(n / rows), n % rows))) n += 1;
    at[id] = { c: Math.floor(n / rows), r: n % rows };
    taken.add(key(at[id].c, at[id].r));
  });
  return at;
};

const DEFAULT_W = 1120;
const DEFAULT_H = 740;
const CASCADE = 30;

const useAreaSize = (ref) => {
  const [size, setSize] = useState({ w: 1280, h: 720 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return size;
};

const Desktop = ({
  apps: allApps = [], renderApp, title, logo, tray, wallpaper, storageKey = 'oneui_desktop',
  defaultIcons, initialApp, onFocusChange, onHelp, clock = true, onClockSettings, openRef, footer, text: words,
}) => {
  const text = { ...TEXT, ...words };
  const apps = allApps.filter((a) => a && a.id);
  const windowed = apps.filter((a) => !a.href);
  const areaRef = useRef(null);
  const area = useAreaSize(areaRef);
  const [state, setState] = useState(() => readDesktop(storageKey, defaultIcons || windowed.map((a) => a.id)));
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [dropCell, setDropCell] = useState(null);
  // A page drawn again from scratch (Reload page): its window keeps its place.
  const [reloads, setReloads] = useState({});
  const [menu, setMenu] = useState(null);
  const hiddenByShow = useRef(null);

  const appOf = (id) => windowed.find((x) => x.id === id);

  // Only pages the app still offers: one taken away closes its window rather
  // than leaving an empty one.
  const wins = state.wins.filter((w) => appOf(w.id));
  const stack = state.stack.filter((id) => wins.some((w) => w.id === id));
  const visible = stack.filter((id) => { const w = wins.find((x) => x.id === id); return w && !w.min; });
  const focusedId = visible.length ? visible[visible.length - 1] : null;

  // Saved a moment after the last change, not on every pointer move of a drag.
  useEffect(() => {
    const timer = setTimeout(() => writeDesktop(storageKey, state), 300);
    return () => clearTimeout(timer);
  }, [state, storageKey]);

  useEffect(() => { if (onFocusChange && focusedId) onFocusChange(focusedId); }, [focusedId]);

  const onContextMenu = (itemsFor) => (e) => {
    const items = (typeof itemsFor === 'function' ? itemsFor() : itemsFor) || [];
    if (!items.filter(Boolean).length) return;
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  };

  const patchWin = (id, patch) => setState((s) => ({ ...s, wins: s.wins.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
  const raise = (s, id) => ({ ...s, stack: s.stack.filter((x) => x !== id).concat(id) });

  const focus = useCallback((id) => {
    setState((s) => {
      const w = s.wins.find((x) => x.id === id);
      if (!w) return s;
      if (s.stack[s.stack.length - 1] === id && !w.min) return s;
      const next = raise(s, id);
      return w.min ? { ...next, wins: next.wins.map((x) => (x.id === id ? { ...x, min: false } : x)) } : next;
    });
  }, []);

  // A new window: where this page was last closed, or cascaded down from the
  // top left, sized to fit the desktop. A link opens in a new tab.
  const open = useCallback((id) => {
    const link = apps.find((a) => a.id === id && a.href);
    if (link) { window.open(link.href, '_blank', 'noopener'); return; }
    hiddenByShow.current = null;
    setState((s) => {
      if (s.wins.some((w) => w.id === id)) {
        const next = raise(s, id);
        return { ...next, wins: next.wins.map((w) => (w.id === id ? { ...w, min: false } : w)) };
      }
      const n = s.wins.length % 8;
      const a = areaRef.current ? { w: areaRef.current.clientWidth, h: areaRef.current.clientHeight } : area;
      const w = Math.min(DEFAULT_W, a.w - 48);
      const hh = Math.min(DEFAULT_H, a.h - 32);
      const r = clampRect(s.geo[id] || {
        w,
        h: hh,
        x: Math.max(0, Math.min(140 + n * CASCADE, a.w - w - 8)),
        y: Math.max(0, Math.min(12 + n * CASCADE, a.h - hh - 8)),
      }, a);
      return { ...s, wins: s.wins.concat({ id, ...r, min: false }), stack: s.stack.filter((x) => x !== id).concat(id) };
    });
  }, [area, allApps]);

  useEffect(() => { if (openRef) openRef.current = open; }, [open]);

  useEffect(() => {
    if (initialApp && appOf(initialApp) && !state.wins.length) open(initialApp);
  }, []);

  const close = (id) => setState((s) => {
    const w = s.wins.find((x) => x.id === id);
    return {
      ...s,
      wins: s.wins.filter((x) => x.id !== id),
      stack: s.stack.filter((x) => x !== id),
      geo: w ? { ...s.geo, [id]: { x: w.x, y: w.y, w: w.w, h: w.h } } : s.geo,
    };
  });
  const minimize = (id) => patchWin(id, { min: true });
  const snap = (id, where) => setState((s) => {
    const next = raise(s, id);
    return { ...next, wins: next.wins.map((w) => (w.id === id ? { ...w, min: false, snap: where } : w)) };
  });
  const toggleMax = (id) => {
    const w = state.wins.find((x) => x.id === id);
    snap(id, w && w.snap === 'max' ? undefined : 'max');
  };

  // A taskbar pill: the window in front goes down, any other comes forward.
  const onPill = (id) => {
    const w = wins.find((x) => x.id === id);
    if (!w) return;
    if (!w.min && id === focusedId) minimize(id); else focus(id);
  };

  // Show desktop: everything down, and the same press puts back what it took
  // down - unless something was opened in between.
  const showDesktop = () => {
    if (visible.length) {
      hiddenByShow.current = visible.slice();
      setState((s) => ({ ...s, wins: s.wins.map((w) => ({ ...w, min: true })) }));
    } else if (hiddenByShow.current) {
      const back = hiddenByShow.current;
      hiddenByShow.current = null;
      setState((s) => ({
        ...s,
        wins: s.wins.map((w) => (back.indexOf(w.id) !== -1 ? { ...w, min: false } : w)),
        stack: s.stack.filter((x) => back.indexOf(x) === -1).concat(back),
      }));
    }
  };

  // Cascade and Tile rearrange the windows showing, in stacking order.
  const cascade = () => setState((s) => {
    const order = s.stack.filter((id) => s.wins.some((w) => w.id === id && !w.min));
    const w = Math.min(DEFAULT_W, area.w - 48 - order.length * CASCADE);
    const hh = Math.min(DEFAULT_H, area.h - 16 - order.length * CASCADE);
    return {
      ...s,
      wins: s.wins.map((x) => {
        const i = order.indexOf(x.id);
        return i === -1 ? x : { ...x, snap: undefined, ...clampRect({ x: 24 + i * CASCADE, y: 8 + i * CASCADE, w, h: hh }, area) };
      }),
    };
  });

  const tile = () => setState((s) => {
    const order = s.stack.filter((id) => s.wins.some((w) => w.id === id && !w.min));
    const n = order.length;
    if (!n) return s;
    const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt(n * (area.w / area.h) / 1.4)) || 1));
    const rows = Math.ceil(n / cols);
    const cw = Math.floor(area.w / cols);
    const ch = Math.floor(area.h / rows);
    return {
      ...s,
      wins: s.wins.map((x) => {
        const i = order.indexOf(x.id);
        if (i === -1) return x;
        return { ...x, snap: undefined, x: (i % cols) * cw, y: Math.floor(i / cols) * ch, w: Math.max(MIN_W, cw), h: Math.max(MIN_H, ch) };
      }),
    };
  });

  const closeAll = () => setState((s) => ({
    ...s,
    wins: [],
    stack: [],
    geo: s.wins.reduce((g, w) => ({ ...g, [w.id]: { x: w.x, y: w.y, w: w.w, h: w.h } }), s.geo),
  }));

  const toggleShortcut = (id) => setState((s) => ({
    ...s,
    shortcuts: s.shortcuts.indexOf(id) === -1 ? s.shortcuts.concat(id) : s.shortcuts.filter((x) => x !== id),
  }));
  const togglePin = (id) => setState((s) => ({
    ...s,
    pinned: s.pinned.indexOf(id) === -1 ? s.pinned.concat(id) : s.pinned.filter((x) => x !== id),
  }));

  // A desktop icon's own label. Empty, or the app's name, goes back to it.
  const rename = (id, label) => setState((s) => {
    const app = appOf(id);
    const names = { ...s.names };
    const v = (label || '').trim().slice(0, 40);
    if (!v || (app && v === app.label)) delete names[id]; else names[id] = v;
    return { ...s, names };
  });
  const labelOf = (app) => state.names[app.id] || app.label;

  const sortShortcuts = () => setState((s) => ({
    ...s,
    iconPos: {},
    shortcuts: s.shortcuts.slice().sort((a, b) => {
      const la = (s.names[a] || (appOf(a) && appOf(a).label) || a).toLowerCase();
      const lb = (s.names[b] || (appOf(b) && appOf(b).label) || b).toLowerCase();
      return la < lb ? -1 : la > lb ? 1 : 0;
    }),
  }));

  // A frame inside a page takes the focus without the press reaching this
  // document: its window is brought forward when the document loses focus to it.
  useEffect(() => {
    const onBlur = () => setTimeout(() => {
      const a = document.activeElement;
      if (a && a.tagName === 'IFRAME') {
        const w = a.closest('[data-win]');
        if (w) focus(w.getAttribute('data-win'));
      }
    }, 0);
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [focus]);

  // Alt+Shift: the browser keeps Ctrl+W, and Alt alone opens its menus.
  useEffect(() => {
    const onKey = (e) => {
      if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;
      const k = e.key.toLowerCase();
      if (k === 'w' && focusedId) { e.preventDefault(); close(focusedId); }
      if (k === 'm' && focusedId) { e.preventDefault(); minimize(focusedId); }
      if (k === 'd') { e.preventDefault(); showDesktop(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // Windows kept on the desktop when the browser shrinks.
  useEffect(() => {
    setState((s) => {
      let changed = false;
      const next = s.wins.map((w) => {
        const r = clampRect(w, area);
        if (r.x !== w.x || r.y !== w.y || r.w !== w.w || r.h !== w.h) { changed = true; return { ...w, ...r }; }
        return w;
      });
      return changed ? { ...s, wins: next } : s;
    });
  }, [area.w, area.h]);

  // One menu for an app wherever it is right-clicked - its icon, its tile in
  // the launcher, its pill on the taskbar, its window's title bar.
  const pinnedNamesItem = () => ({
    label: text.pinnedNames,
    checked: state.pinnedNames,
    onClick: () => setState((s) => ({ ...s, pinnedNames: !s.pinnedNames })),
  });
  const appMenu = (id, where) => () => {
    const app = appOf(id);
    if (!app) return [];
    const w = wins.find((x) => x.id === id);
    const front = w && !w.min && id === focusedId;
    return [
      !front && { label: w ? (w.min ? text.restore : text.bringFront) : text.open, icon: w && w.min ? 'restoreWindow' : 'expand', onClick: () => open(id) },
      !w && { label: text.openMax, icon: 'maximize', onClick: () => { open(id); snap(id, 'max'); } },
      w && !w.min && { label: text.minimize, icon: 'minimize', onClick: () => minimize(id) },
      w && { label: w.snap === 'max' ? text.restoreSize : text.maximize, icon: w.snap === 'max' ? 'restoreWindow' : 'maximize', onClick: () => toggleMax(id) },
      w && { label: text.leftHalf, icon: 'snapLeft', onClick: () => snap(id, 'left') },
      w && { label: text.rightHalf, icon: 'snapRight', onClick: () => snap(id, 'right') },
      'separator',
      state.shortcuts.indexOf(id) === -1
        ? { label: text.addDesktop, icon: 'plus', onClick: () => setState((s) => ({ ...s, shortcuts: s.shortcuts.concat(id), hideIcons: false })) }
        : { label: text.removeDesktop, icon: 'trash', onClick: () => toggleShortcut(id) },
      { label: state.pinned.indexOf(id) === -1 ? text.pin : text.unpin, icon: 'pin', onClick: () => togglePin(id) },
      where === 'desktop' && { label: text.rename, icon: 'edit', onClick: () => setRenaming(id) },
      where === 'desktop' && state.names[id] && { label: text.ownName, icon: 'refresh', onClick: () => rename(id, '') },
      onHelp && { label: `${text.help}: ${app.label}`, icon: 'help', onClick: () => onHelp(id) },
      w && { label: text.reload, icon: 'refresh', onClick: () => setReloads((r) => ({ ...r, [id]: (r[id] || 0) + 1 })) },
      where === 'taskbar' && 'separator',
      where === 'taskbar' && pinnedNamesItem(),
      w && 'separator',
      w && { label: text.close, icon: 'close', danger: true, onClick: () => close(id) },
    ];
  };

  const taskbarMenu = () => [
    pinnedNamesItem(),
    'separator',
    { label: text.showDesktop, icon: 'showDesktop', onClick: showDesktop },
    { label: text.cascade, icon: 'layers', onClick: cascade, disabled: !visible.length },
    { label: text.tile, icon: 'apps', onClick: tile, disabled: !visible.length },
  ];

  // The icon grid in pixels: a cell, the room around it, and how many fit.
  const shortcuts = state.shortcuts.map(appOf).filter(Boolean);
  const rem = remPx();
  const cw = ICON_CELL[state.iconSize].w * rem;
  const ch = ICON_CELL[state.iconSize].h * rem;
  const pad = CELL_PAD * rem;
  const gap = CELL_GAP * rem;
  const cols = Math.max(1, Math.floor((area.w - 2 * pad + gap) / (cw + gap)));
  const rows = Math.max(1, Math.floor((area.h - 2 * pad + gap) / (ch + gap)));
  const iconAt = layoutIcons(shortcuts.map((a) => a.id), state.autoArrange, state.iconPos, cols, rows);
  const cellStyle = (p) => ({ left: `${pad + p.c * (cw + gap)}px`, top: `${pad + p.r * (ch + gap)}px`, width: `${cw}px`, height: `${ch}px` });
  const cellAt = (e) => {
    const box = areaRef.current.getBoundingClientRect();
    const c = Math.max(0, Math.floor((e.clientX - box.left - pad) / (cw + gap)));
    const r = Math.max(0, Math.min(rows - 1, Math.floor((e.clientY - box.top - pad) / (ch + gap))));
    return { c: state.autoArrange ? c : Math.min(cols - 1, c), r };
  };

  // An icon dropped on a cell, dragged on the desktop or out of the launcher.
  // Auto arrange puts it at that place in the order; otherwise it takes the
  // cell, and an icon already there takes the one it came from.
  const dropIcon = (id, target) => setState((s) => {
    const list = s.shortcuts.indexOf(id) === -1 ? s.shortcuts.concat(id) : s.shortcuts.slice();
    if (s.autoArrange) {
      const rest = list.filter((x) => x !== id);
      rest.splice(Math.min(target.c * rows + target.r, rest.length), 0, id);
      return { ...s, shortcuts: rest, hideIcons: false };
    }
    const pos = {};
    Object.keys(iconAt).forEach((k) => { pos[k] = { ...iconAt[k] }; });
    const from = pos[id];
    const there = Object.keys(pos).find((k) => k !== id && pos[k].c === target.c && pos[k].r === target.r);
    if (there) { if (from) pos[there] = from; else delete pos[there]; }
    pos[id] = { c: target.c, r: target.r };
    return { ...s, shortcuts: list, iconPos: pos, hideIcons: false };
  });

  // Off: every icon stays where it is on screen, now its own place. On: they
  // close up in columns, in the order they stood.
  const toggleAutoArrange = () => setState((s) => {
    if (s.autoArrange) {
      const pos = {};
      Object.keys(iconAt).forEach((k) => { pos[k] = { ...iconAt[k] }; });
      return { ...s, autoArrange: false, iconPos: pos };
    }
    const order = s.shortcuts.slice().sort((a, b) => {
      const pa = iconAt[a];
      const pb = iconAt[b];
      if (!pa || !pb) return (pa ? -1 : 0) + (pb ? 1 : 0);
      return pa.c - pb.c || pa.r - pb.r;
    });
    return { ...s, autoArrange: true, shortcuts: order };
  });

  // The wallpaper: useWallpaper's control, a wallpaper object, or the wash.
  const control = wallpaper && wallpaper.set ? wallpaper : null;
  const wp = control ? control.current : wallpaper && (wallpaper.style || wallpaper.className) ? wallpaper : wallpaperOf('wash');

  const desktopMenu = () => [
    { label: text.view, icon: 'apps', items: [
      { label: text.large, checked: state.iconSize === 'lg', onClick: () => setState((s) => ({ ...s, iconSize: 'lg' })) },
      { label: text.medium, checked: state.iconSize === 'md', onClick: () => setState((s) => ({ ...s, iconSize: 'md' })) },
      { label: text.small, checked: state.iconSize === 'sm', onClick: () => setState((s) => ({ ...s, iconSize: 'sm' })) },
      'separator',
      { label: state.hideIcons ? text.showIcons : text.hideIcons, icon: state.hideIcons ? 'expand' : 'ban', onClick: () => setState((s) => ({ ...s, hideIcons: !s.hideIcons })) },
    ] },
    { label: text.arrange, icon: 'list', items: [
      { label: text.autoArrange, checked: state.autoArrange, onClick: toggleAutoArrange },
      { label: text.sortName, icon: 'list', onClick: sortShortcuts, disabled: state.shortcuts.length < 2 },
      'separator',
      { label: text.cascade, icon: 'layers', onClick: cascade, disabled: !visible.length },
      { label: text.tile, icon: 'apps', onClick: tile, disabled: !visible.length },
    ] },
    control && { label: text.wallpaper, icon: 'image', items: [
      ...wallpapers().map((w) => ({ label: w.label, checked: control.id === w.id, onClick: () => control.set(w.id) })),
      control.custom && { label: control.customLabel || 'Your picture', checked: control.id === 'custom', onClick: () => control.set('custom') },
      'separator',
      { label: text.ownPicture, icon: 'upload', onClick: control.choose },
    ] },
    'separator',
    { label: text.showDesktop, icon: 'showDesktop', onClick: showDesktop },
    { label: text.closeAll, icon: 'close', onClick: closeAll, disabled: !wins.length },
  ];

  return (
    <div className={`h-full flex flex-col overflow-clip overscroll-none ${wp.className || ''} ${busy ? 'oui-busy' : ''}`} style={wp.style}>
      <Taskbar
        apps={apps}
        wins={wins}
        focusedId={focusedId}
        title={title}
        logo={logo}
        text={text}
        clock={clock}
        onClockSettings={onClockSettings}
        onOpen={open}
        onPill={onPill}
        onPillMenu={(id) => onContextMenu(appMenu(id, 'taskbar'))}
        appMenu={appMenu}
        onContextMenu={onContextMenu}
        pinned={state.pinned}
        pinnedNames={state.pinnedNames}
        onBarMenu={onContextMenu(taskbarMenu)}
        onClosePill={close}
        onShowDesktop={showDesktop}
        tray={tray}
        footer={footer}
      />

      {/* The desktop never scrolls: overflow-clip, not hidden, which the
          browser may still scroll to bring a focused field into view. */}
      <div ref={areaRef} className="relative flex-1 min-h-0 overflow-clip overscroll-none">
        <div
          className="absolute inset-0"
          onContextMenu={onContextMenu(desktopMenu)}
          onDragOver={(e) => {
            if (!dragApp(e)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const c = cellAt(e);
            setDropCell((d) => (d && d.c === c.c && d.r === c.r ? d : c));
          }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropCell(null); }}
          onDrop={(e) => {
            const id = dragApp(e);
            setDropCell(null);
            if (!id) return;
            e.preventDefault();
            dropIcon(id, cellAt(e));
          }}
        >
          {/* On a small frosted ground, opaque enough to read on any
              wallpaper; under the windows, like everything on the desktop.
              It holds no menus, so the blur can sit on the box. Bottom middle:
              the corners are where a widget or the music player sit. */}
          {footer && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-3 whitespace-nowrap px-2.5 py-1 rounded-lg bg-white/85 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm ring-1 ring-black/5 dark:ring-white/10 text-xs text-gray-600 dark:text-gray-300">
              {footer}
            </div>
          )}
          {dropCell && !state.hideIcons && (
            <div className="absolute rounded-xl ring-2 ring-blue-500/70 bg-blue-500/10 pointer-events-none" style={cellStyle(dropCell)} />
          )}
          {!state.hideIcons && shortcuts.map((app) => {
            const size = ICON_SIZE[state.iconSize];
            return (
              <div key={app.id} className="absolute" style={cellStyle(iconAt[app.id])}>
                <button
                  type="button"
                  draggable={renaming !== app.id}
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData(APP_MIME, app.id); e.dataTransfer.setData('text/plain', app.label); }}
                  onDragEnd={() => setDropCell(null)}
                  onClick={() => { if (renaming !== app.id) open(app.id); }}
                  onKeyDown={(e) => {
                    if (renaming === app.id) return;
                    if (e.key === 'Delete') { e.preventDefault(); toggleShortcut(app.id); }
                    if (e.key === 'F2') { e.preventDefault(); setRenaming(app.id); }
                  }}
                  onContextMenu={onContextMenu(appMenu(app.id, 'desktop'))}
                  title={app.subtitle || app.label}
                  className={`group w-full h-full flex flex-col items-center justify-center ${size.gap} p-2 rounded-xl text-center hover:bg-white/40 dark:hover:bg-white/10 focus:bg-blue-500/15 focus:outline-hidden transition-colors`}
                >
                  <span className={`${size.tile} shrink-0 rounded-2xl bg-linear-to-br from-blue-400 to-blue-600 text-on-accent shadow-md shadow-black/15 ring-1 ring-white/20 flex items-center justify-center transition-transform group-hover:scale-105`}>
                    <Icon icon={app.icon} size={size.glyph} />
                  </span>
                  {renaming === app.id ? (
                    <input
                      ref={(el) => { if (el && document.activeElement !== el) { el.focus(); el.select(); } }}
                      defaultValue={labelOf(app)}
                      maxLength={40}
                      aria-label={`${text.newName}: ${app.label}`}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') { rename(app.id, e.currentTarget.value); setRenaming(null); }
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      onBlur={(e) => { rename(app.id, e.currentTarget.value); setRenaming(null); }}
                      className="w-full px-1 py-0.5 rounded-md text-xs text-center bg-white dark:bg-zinc-800 text-gray-900 dark:text-white ring-2 ring-blue-500 focus:outline-hidden"
                    />
                  ) : (
                    <span className={`${size.text} font-medium leading-tight line-clamp-2 ${wp.dark ? 'oui-on-dark' : 'text-gray-800 dark:text-gray-100'}`}>
                      {labelOf(app)}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {wins.map((w) => {
          const app = appOf(w.id);
          return (
            <Window
              key={w.id}
              win={w}
              app={app}
              text={text}
              z={10 + 2 * stack.indexOf(w.id)}
              focused={w.id === focusedId}
              area={area}
              areaRef={areaRef}
              onFocus={() => focus(w.id)}
              onChange={(patch) => patchWin(w.id, patch)}
              onClose={() => close(w.id)}
              onMinimize={() => minimize(w.id)}
              onToggleMax={() => toggleMax(w.id)}
              onSnapPreview={setPreview}
              onBusy={setBusy}
              onHelp={onHelp ? () => onHelp(w.id) : null}
              onTitleMenu={onContextMenu(appMenu(w.id, 'title'))}
            >
              <Fragment key={reloads[w.id] || 0}>{renderApp(w.id, open)}</Fragment>
            </Window>
          );
        })}

        {/* Where a window let go now would snap to. */}
        {preview && (() => {
          const r = rectOf({ snap: preview }, area);
          return (
            <div
              className="absolute z-[44] pointer-events-none rounded-2xl border-2 border-blue-500/60 bg-blue-500/10 transition-all duration-150"
              style={{ left: `${r.x + 6}px`, top: `${r.y + 6}px`, width: `${r.w - 12}px`, height: `${r.h - 12}px` }}
            />
          );
        })()}
      </div>

      <ContextMenu menu={menu} onClose={() => setMenu(null)} />
    </div>
  );
};

export default Desktop;
