import { h } from 'preact';
import { useRef } from 'preact/hooks';
import { Icon } from '../../icons';
import { InWindow } from './context';

// One window of the desktop: a page of the app - what the sidebar opens in the
// classic layout - in a frame that moves, resizes from every edge and corner,
// snaps to a half, a quarter or the whole desktop, minimises and maximises.
// The page keeps the app's own ground, without its wash, with its cards on it;
// the title bar sits on the same ground with no band or rule.
//
// Three rules the pages it holds depend on:
//
//   - Nothing on the frame may be a containing block for position: fixed.
//     Dialogs, menus and popovers are fixed and drawn where they are opened.
//     A transform, a filter or a backdrop-filter on the frame would pin them
//     inside it and cut them off, so the frame is placed by left/top, and its
//     glass is on a ::before (.oui-win in one-ui.css), as .panel's is.
//   - A minimised window stays mounted, hidden: a half-filled form must be
//     there when it comes back.
//   - Windows are drawn in the order they were opened and stacked by z-index
//     alone (see Desktop). Moving an iframe in the DOM reloads it.

export const MIN_W = 420;
export const MIN_H = 260;
// How near an edge the pointer has to be, in px, for a drag to snap.
const SNAP_EDGE = 6;
// How far from a corner, along an edge, still snaps to that corner's quarter.
const CORNER = 48;
// How much of a window must stay on the desktop: enough of its title bar to
// take hold of again.
const KEEP = 120;

// Where a window is drawn: its own rectangle, or the part of the desktop it
// is snapped to. x/y/w/h stay the window's own size while it is snapped, so
// unsnapping gives it back.
export const rectOf = (win, area) => {
  const W = area.w;
  const H = area.h;
  const hw = Math.round(W / 2);
  const hh = Math.round(H / 2);
  switch (win.snap) {
    case 'max': return { x: 0, y: 0, w: W, h: H };
    case 'left': return { x: 0, y: 0, w: hw, h: H };
    case 'right': return { x: hw, y: 0, w: W - hw, h: H };
    case 'tl': return { x: 0, y: 0, w: hw, h: hh };
    case 'tr': return { x: hw, y: 0, w: W - hw, h: hh };
    case 'bl': return { x: 0, y: hh, w: hw, h: H - hh };
    case 'br': return { x: hw, y: hh, w: W - hw, h: H - hh };
    default: return { x: win.x, y: win.y, w: win.w, h: win.h };
  }
};

// A rectangle kept where it can still be reached.
export const clampRect = (r, area) => {
  const w = Math.max(MIN_W, Math.min(r.w, area.w));
  const h = Math.max(MIN_H, Math.min(r.h, area.h));
  return {
    w,
    h,
    x: Math.max(KEEP - w, Math.min(r.x, area.w - KEEP)),
    y: Math.max(0, Math.min(r.y, area.h - 40)),
  };
};

const CONTROL = 'w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 transition-colors';
const CONTROL_HOVER = 'hover:bg-black/5 hover:text-gray-800 dark:hover:bg-white/10 dark:hover:text-white';

// The resize handles: four edges and four corners, each a strip just inside
// the frame. Corners are larger, and drawn after the edges, so they win where
// they overlap.
const HANDLES = [
  ['n', 'top-0 left-3 right-3 h-1.5 cursor-ns-resize'],
  ['s', 'bottom-0 left-3 right-3 h-1.5 cursor-ns-resize'],
  ['w', 'left-0 top-3 bottom-3 w-1.5 cursor-ew-resize'],
  ['e', 'right-0 top-3 bottom-3 w-1.5 cursor-ew-resize'],
  ['nw', 'top-0 left-0 w-3 h-3 cursor-nwse-resize'],
  ['ne', 'top-0 right-0 w-3 h-3 cursor-nesw-resize'],
  ['sw', 'bottom-0 left-0 w-3 h-3 cursor-nesw-resize'],
  ['se', 'bottom-0 right-0 w-3.5 h-3.5 cursor-nwse-resize'],
];

const Window = ({
  win, app, z, focused, area, areaRef, text,
  onFocus, onChange, onClose, onMinimize, onToggleMax, onSnapPreview, onBusy, onHelp, onTitleMenu,
  children,
}) => {
  const drag = useRef(null);
  const pageRef = useRef(null);
  const rect = rectOf(win, area);

  // The wheel over the frame - its title bar, an edge - scrolls its page, so
  // the wheel always moves the window under the pointer. Over the page itself
  // the browser already scrolls what is under the pointer.
  const onFrameWheel = (e) => {
    const page = pageRef.current;
    if (!page || e.ctrlKey || page.contains(e.target)) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? page.clientHeight : 1;
    page.scrollBy({ top: e.deltaY * unit, left: e.deltaX * unit });
    e.preventDefault();
  };

  // The pointer, in desktop coordinates.
  const local = (e) => {
    const b = areaRef.current ? areaRef.current.getBoundingClientRect() : { left: 0, top: 0 };
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };

  // An edge snaps to a half or the whole desktop, a corner to a quarter.
  const snapAt = (p) => {
    const left = p.x <= SNAP_EDGE;
    const right = p.x >= area.w - SNAP_EDGE;
    const top = p.y <= SNAP_EDGE;
    const bottom = p.y >= area.h - SNAP_EDGE;
    const nearL = p.x <= CORNER;
    const nearR = p.x >= area.w - CORNER;
    const nearT = p.y <= CORNER;
    const nearB = p.y >= area.h - CORNER;
    if ((left && nearT) || (top && nearL)) return 'tl';
    if ((right && nearT) || (top && nearR)) return 'tr';
    if ((left && nearB) || (bottom && nearL)) return 'bl';
    if ((right && nearB) || (bottom && nearR)) return 'br';
    if (top) return 'max';
    if (left) return 'left';
    if (right) return 'right';
    return null;
  };

  // --- moving, by the title bar
  const onTitleDown = (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    onFocus();
    drag.current = { kind: 'move', start: local(e), rect, moved: false, snapped: !!win.snap, snap: null };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* a pointer already gone */ }
  };

  const onTitleMove = (e) => {
    const d = drag.current;
    if (!d || d.kind !== 'move') return;
    const p = local(e);
    const dx = p.x - d.start.x;
    const dy = p.y - d.start.y;
    if (!d.moved) {
      // A few pixels before it counts, so a click on the title bar - or the
      // first half of a double-click - does not unsnap a window.
      if (Math.abs(dx) + Math.abs(dy) < 4) return;
      d.moved = true;
      onBusy(true);
      if (d.snapped) {
        // Out of a snap: back to its own size, under the pointer at the same
        // fraction of its width it was held at.
        const frac = (d.start.x - d.rect.x) / d.rect.w;
        d.rect = { x: Math.round(d.start.x - frac * win.w), y: 0, w: win.w, h: win.h };
        d.snapped = false;
      }
    }
    const next = clampRect({ ...d.rect, x: d.rect.x + dx, y: d.rect.y + dy }, area);
    const snap = snapAt(p);
    if (snap !== d.snap) { d.snap = snap; onSnapPreview(snap); }
    onChange({ x: next.x, y: next.y, w: next.w, h: next.h, snap: undefined });
  };

  const onTitleUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    onBusy(false);
    onSnapPreview(null);
    if (d.snap) onChange({ snap: d.snap });
  };

  // --- resizing, by the edges
  const onHandleDown = (dir) => (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onFocus();
    // Resizing a snapped window turns it into a window of that size.
    drag.current = { kind: 'size', dir, start: local(e), rect };
    onBusy(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* a pointer already gone */ }
  };

  const onHandleMove = (e) => {
    const d = drag.current;
    if (!d || d.kind !== 'size') return;
    const p = local(e);
    const dx = p.x - d.start.x;
    const dy = p.y - d.start.y;
    let { x, y, w, h } = d.rect;
    if (d.dir.includes('e')) w = Math.min(Math.max(MIN_W, d.rect.w + dx), area.w - x);
    if (d.dir.includes('s')) h = Math.min(Math.max(MIN_H, d.rect.h + dy), area.h - y);
    if (d.dir.includes('w')) {
      w = Math.max(MIN_W, d.rect.w - dx);
      x = d.rect.x + d.rect.w - w;
      if (x < 0) { w += x; x = 0; }
    }
    if (d.dir.includes('n')) {
      h = Math.max(MIN_H, d.rect.h - dy);
      y = d.rect.y + d.rect.h - h;
      if (y < 0) { h += y; y = 0; }
    }
    onChange({ x, y, w, h, snap: undefined });
  };

  const onHandleUp = () => {
    if (!drag.current) return;
    drag.current = null;
    onBusy(false);
  };

  // A maximised window loses its rounding, where it meets the desktop's edges.
  const square = win.snap === 'max';

  return (
    <section
      data-win={win.id}
      role="dialog"
      aria-label={app.label}
      style={{
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.w}px`,
        height: `${rect.h}px`,
        zIndex: z,
        display: win.min ? 'none' : undefined,
      }}
      // Capture, so a press anywhere inside brings the window forward before
      // the page acts on it.
      onPointerDownCapture={onFocus}
      onWheel={onFrameWheel}
      className={`absolute flex flex-col overflow-clip oui-win ${square ? '' : 'rounded-2xl'} ${
        focused ? 'shadow-2xl ring-1 ring-black/10 dark:ring-white/15' : 'shadow-xl ring-1 ring-black/5 dark:ring-white/5'
      }`}
    >
      <header
        className="flex items-center justify-between gap-2 pl-3 pr-1.5 py-1.5 shrink-0 select-none cursor-default"
        onPointerDown={onTitleDown}
        onPointerMove={onTitleMove}
        onPointerUp={onTitleUp}
        onPointerCancel={onTitleUp}
        onDblClick={(e) => { if (!e.target.closest('button')) onToggleMax(); }}
        onContextMenu={onTitleMenu}
      >
        <div className={`flex items-center gap-2 min-w-0 ${focused ? '' : 'opacity-60'}`}>
          <span className="w-6 h-6 shrink-0 rounded-lg bg-linear-to-br from-blue-400 to-blue-600 text-on-accent flex items-center justify-center">
            <Icon icon={app.icon} size={14} />
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{app.label}</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {onHelp && (
            <button type="button" className={`${CONTROL} ${CONTROL_HOVER} text-[13px] font-semibold`} onClick={onHelp} aria-label={text.help} title={text.help}>?</button>
          )}
          <button type="button" className={`${CONTROL} ${CONTROL_HOVER}`} onClick={onMinimize} aria-label={text.minimize} title={text.minimize}>
            <Icon icon="minimize" size={14} />
          </button>
          <button type="button" className={`${CONTROL} ${CONTROL_HOVER}`} onClick={onToggleMax} aria-label={square ? text.restore : text.maximize} title={square ? text.restore : text.maximize}>
            <Icon icon={square ? 'restoreWindow' : 'maximize'} size={13} />
          </button>
          <button type="button" className={`${CONTROL} hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400`} onClick={onClose} aria-label={text.close} title={text.close}>
            <Icon icon="close" size={15} />
          </button>
        </div>
      </header>

      {/* The page, scrolling on its own. oui-win-page makes it the container
          sm: md: lg: xl: measure inside a window (one-ui.css), so a narrow
          window lays its page out narrow. overscroll-contain: at its top or
          bottom the wheel stops here rather than passing to the desktop. */}
      <div ref={pageRef} className="oui-win-page flex-1 min-h-0 overflow-auto overscroll-contain px-4 sm:px-5 pb-5 pt-1">
        <InWindow.Provider value={true}>{children}</InWindow.Provider>
      </div>

      {!square && HANDLES.map(([dir, cls]) => (
        <div
          key={dir}
          className={`absolute ${cls}`}
          onPointerDown={onHandleDown(dir)}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
        />
      ))}
    </section>
  );
};

export default Window;
