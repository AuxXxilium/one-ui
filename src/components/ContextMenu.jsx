import { h, Fragment } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../icons';

// A right-click menu, from Arc VMM, and the "..." button that opens the same
// list, from Firevisor.
//
//   const [menu, setMenu] = useState(null);
//   <div onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, title, items }); }}>
//   <ContextMenu menu={menu} onClose={() => setMenu(null)} />
//
//   <MenuButton items={items} />        the same items behind a "..." button
//
// menu is {x, y, title?, items} while open and null otherwise. Each item is
//
//   { label, onClick, icon?, danger?, disabled?, title?, checked? }
//   { label, icon?, items: [...] }      a second menu, opened beside it
//   'separator'                         a rule between groups
//
// A falsy item is left out, so a caller can write `canEdit && {...}` inline.
// checked (true or false) makes the entry a tick-box entry: a tick in the
// icon column while it is on. Picking an entry closes the menu first, so a
// dialog the action opens is not drawn under it.
//
// It closes on a click or right-click anywhere else, on Escape, and when the
// page scrolls, resizes or loses focus: a menu left floating where the content
// has moved away from points at the wrong thing. Up and Down move between the
// items, Right opens a second menu and Left goes back, as a desktop menu does.
//
// Fixed at the pointer, moved back inside the window when it would run past the
// right edge, and opened upward when there is no room below - placed before the
// browser paints, so it never shows for a frame in the wrong spot. A .panel
// .panel-menu, so under glass it is the clearer glass of a menu. Menus fit
// their entries, between 11rem and 18rem, rather than cut a long one short.

const PANEL = 'rounded-xl panel panel-menu shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-1';
const WIDTH = 'min-w-44 w-max max-w-72';

const rowClass = (item, open) => `flex w-full items-center gap-2.5 text-left px-2.5 py-1.5 rounded-lg text-sm transition-colors focus:outline-hidden enabled:hover:bg-black/5 enabled:focus:bg-black/5 dark:enabled:hover:bg-white/10 dark:enabled:focus:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed ${
  item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'
} ${open ? 'bg-black/5 dark:bg-white/10' : ''}`;

// The column is kept for an entry without an icon too, so the labels of a
// menu line up whichever of them have one. A ticked entry shows the tick there.
const Glyph = ({ item }) => (
  <span className="w-4 h-4 shrink-0 flex items-center justify-center">
    {item.checked ? <Icon icon="check" size={16} /> : item.icon && <Icon icon={item.icon} size={16} />}
  </span>
);

// The menuitems of the menu `el` itself, not of a second menu open inside it.
const ownItems = (el) => [...el.querySelectorAll('[role="menuitem"]:not([disabled]), [role="menuitemcheckbox"]:not([disabled])')]
  .filter((b) => b.closest('[role="menu"]') === el);

// Up, Down, Right and Left within one menu.
const onMenuKey = (e, onBack) => {
  const menu = e.currentTarget;
  if (e.key === 'ArrowLeft' && onBack) {
    e.preventDefault();
    e.stopPropagation();
    onBack();
    return;
  }
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  e.stopPropagation();
  const items = ownItems(menu);
  if (!items.length) return;
  const at = items.indexOf(document.activeElement);
  const next = e.key === 'ArrowDown'
    ? items[(at + 1) % items.length]
    : items[(at - 1 + items.length) % items.length];
  next.focus();
};

// An entry that opens a second menu beside it, on hover, on a click and on
// Right. It flips to the left when there is no room on the right, and upward
// when it would run off the bottom.
const SubMenu = ({ item, onPick }) => {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState({ left: false, up: false });
  const row = useRef(null);
  const sub = useRef(null);
  const timer = useRef(null);
  const show = (focus) => {
    clearTimeout(timer.current);
    if (!open && row.current) {
      const r = row.current.getBoundingClientRect();
      const n = item.items.filter(Boolean).length;
      setSide({ left: r.right + 288 > window.innerWidth, up: r.top + n * 34 + 16 > window.innerHeight });
    }
    setOpen(focus ? 'focus' : true);
  };
  const hide = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(false), 180); };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (open !== 'focus' || !sub.current) return;
    const first = ownItems(sub.current)[0];
    if (first) first.focus();
  }, [open]);
  const back = () => {
    setOpen(false);
    row.current?.querySelector('button')?.focus();
  };

  return (
    <div ref={row} className="relative" onMouseEnter={() => show(false)} onMouseLeave={hide}>
      <button
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={!!open}
        disabled={item.disabled}
        title={item.title}
        className={rowClass(item, open)}
        onClick={() => (open ? setOpen(false) : show(true))}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); show(true); } }}
      >
        <Glyph item={item} />
        <span className="truncate flex-1">{item.label}</span>
        <Icon icon="chevronRight" size={14} className="shrink-0 opacity-60" />
      </button>
      {open && !item.disabled && (
        <div
          ref={sub}
          role="menu"
          aria-label={item.label}
          className={`absolute z-10 ${WIDTH} ${PANEL} ${side.left ? 'right-full mr-1' : 'left-full ml-1'} ${side.up ? 'bottom-0' : '-top-1'}`}
          onKeyDown={(e) => onMenuKey(e, back)}
        >
          <MenuItems items={item.items} onPick={onPick} />
        </div>
      )}
    </div>
  );
};

const MenuItems = ({ items, onPick }) => (
  <Fragment>
    {items.filter(Boolean).map((item, i) => {
      if (item === 'separator') {
        return <div key={`sep${i}`} role="separator" className="my-1 mx-1.5 h-px bg-black/10 dark:bg-white/10" />;
      }
      if (item.items) return <SubMenu key={item.label} item={item} onPick={onPick} />;
      const tick = item.checked !== undefined;
      return (
        <button
          key={item.label}
          type="button"
          role={tick ? 'menuitemcheckbox' : 'menuitem'}
          aria-checked={tick ? !!item.checked : undefined}
          disabled={item.disabled}
          title={item.title}
          className={rowClass(item)}
          onClick={() => {
            onPick();
            if (item.onClick) item.onClick();
          }}
        >
          <Glyph item={item} />
          <span className="truncate">{item.label}</span>
        </button>
      );
    })}
  </Fragment>
);

// Closing on a click elsewhere and on Escape, for both forms. Capture, so a
// control that stops the event on its way up still closes the menu when it is
// pressed.
const useCloseOutside = (open, ref, onClose, alsoOnMove) => {
  useEffect(() => {
    if (!open) return undefined;
    const close = () => onClose();
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      onClose();
    };
    document.addEventListener('mousedown', onPointer, true);
    document.addEventListener('keydown', onKey);
    if (alsoOnMove) {
      document.addEventListener('scroll', close, true);
      window.addEventListener('resize', close);
      window.addEventListener('blur', close);
    }
    return () => {
      document.removeEventListener('mousedown', onPointer, true);
      document.removeEventListener('keydown', onKey);
      if (alsoOnMove) {
        document.removeEventListener('scroll', close, true);
        window.removeEventListener('resize', close);
        window.removeEventListener('blur', close);
      }
    };
  }, [open]);
};

const ContextMenu = ({ menu, onClose }) => {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!menu || !el) return;
    const w = el.offsetWidth;
    const hgt = el.offsetHeight;
    const x = Math.max(8, Math.min(menu.x, window.innerWidth - w - 8));
    const y = menu.y + hgt + 8 > window.innerHeight ? Math.max(8, menu.y - hgt) : menu.y;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    const first = ownItems(el)[0];
    if (first) first.focus({ preventScroll: true });
  }, [menu]);

  useCloseOutside(!!menu, ref, onClose, true);

  if (!menu) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={menu.title || 'Actions'}
      className={`fixed z-50 ${WIDTH} ${PANEL}`}
      style={{ left: `${menu.x}px`, top: `${menu.y}px` }}
      // Stopped as well as cancelled: the page behind opens its own menu on a
      // right-click, and would replace this one with it.
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onKeyDown={(e) => onMenuKey(e)}
    >
      {menu.title && (
        <div className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
          {menu.title}
        </div>
      )}
      <MenuItems items={menu.items} onPick={onClose} />
    </div>
  );
};

// The "..." button form of the same menu. Right-click is invisible: nothing
// on a page says it is there. This is what says the actions exist, and it
// opens the same list - build the items once and hand them to both.
//
//   items      as ContextMenu's
//   label      the button's tooltip and accessible name ("More actions")
//   icon       the glyph, "more" by default
//   align      'right' (default) or 'left': which edge of the button the
//              menu lines up with
//
// The menu is fixed to the window, placed against the button, so a card's
// overflow or a table that scrolls sideways does not cut it off; it opens
// upward when there is no room below, and closes when the page scrolls, as
// the right-click menu does. Its button carries aria-expanded, which under
// glass lifts the card it sits in above the cards after it while it is open.
export const MenuButton = ({ items, label = 'More actions', icon = 'more', align = 'right', className = '' }) => {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const menuRef = useRef(null);
  useCloseOutside(open, wrap, () => setOpen(false), true);

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!open || !el || !wrap.current) return;
    const r = wrap.current.getBoundingClientRect();
    const w = el.offsetWidth;
    const hgt = el.offsetHeight;
    const x = Math.max(8, Math.min(align === 'left' ? r.left : r.right - w, window.innerWidth - w - 8));
    const y = r.bottom + 4 + hgt + 8 > window.innerHeight ? Math.max(8, r.top - 4 - hgt) : r.bottom + 4;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.visibility = 'visible';
    const first = ownItems(el)[0];
    if (first) first.focus({ preventScroll: true });
  }, [open]);

  const live = (items || []).filter(Boolean);
  if (!live.length) return null;

  return (
    <div className={`relative shrink-0 ${className}`} ref={wrap}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        aria-label={label}
        // The same square as a Button beside it, with a drawn ellipsis.
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-200/70 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Icon icon={icon} size={16} />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          // Hidden until placed, so it never shows for a frame at 0,0.
          className={`fixed z-50 text-left ${WIDTH} ${PANEL}`}
          style={{ left: '0px', top: '0px', visibility: 'hidden' }}
          onKeyDown={(e) => onMenuKey(e)}
        >
          <MenuItems items={live} onPick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
};

// No browser right-click menu over the app, for an app that has menus of its
// own: where right-clicking means something the app opens its menu, and
// everywhere else nothing happens, rather than the browser's Back, Reload and
// View source turning up beside the app's. In an app embedded in a frame -
// DSM's windows are one - those act on the frame, and Reload drops whatever a
// dialog held.
//
// Text fields keep the browser's menu: it is how paste and spelling
// suggestions are reached. Registered on the document, after any element's own
// handler, so the app's menus have already opened by the time this cancels the
// browser's.
export const useNoBrowserMenu = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return undefined;
    const onContextMenu = (e) => {
      const t = e.target;
      if (t && t.closest && t.closest(
        'textarea, [contenteditable="true"], input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"])',
      )) return;
      e.preventDefault();
    };
    document.addEventListener('contextmenu', onContextMenu);
    return () => document.removeEventListener('contextmenu', onContextMenu);
  }, [enabled]);
};

export default ContextMenu;
