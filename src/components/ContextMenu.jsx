import { h } from 'preact';
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { Icon } from '../icons';

// A right-click menu, from Arc VMM.
//
//   const [menu, setMenu] = useState(null);
//   <div onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, title, items }); }}>
//   <ContextMenu menu={menu} onClose={() => setMenu(null)} />
//
// menu is {x, y, title?, items} while open and null otherwise. Each item is
// {label, onClick, icon?, danger?, disabled?, title?}, or the string
// 'separator' for a rule between groups. Picking one closes the menu first, so
// a dialog the action opens is not drawn under it.
//
// It closes on a click or right-click anywhere else, on Escape, and when the
// page scrolls, resizes or loses focus: a menu left floating where the content
// has moved away from points at the wrong thing. Up and Down move between the
// items, as a desktop menu does.
//
// Fixed at the pointer, moved back inside the window when it would run past the
// right edge, and opened upward when there is no room below - placed before the
// browser paints, so it never shows for a frame in the wrong spot. A .panel
// .panel-menu, so under glass it is the clearer glass of a menu.
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
    const first = el.querySelector('[role="menuitem"]:not([disabled])');
    if (first) first.focus({ preventScroll: true });
  }, [menu]);

  useEffect(() => {
    if (!menu) return undefined;
    const close = () => onClose();
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const items = [...ref.current.querySelectorAll('[role="menuitem"]:not([disabled])')];
      if (!items.length) return;
      const at = items.indexOf(document.activeElement);
      const next = e.key === 'ArrowDown'
        ? items[(at + 1) % items.length]
        : items[(at - 1 + items.length) % items.length];
      next.focus();
    };
    // Capture, so a control that stops the event on its way up still closes
    // the menu when it is pressed.
    document.addEventListener('mousedown', onPointer, true);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('blur', close);
    return () => {
      document.removeEventListener('mousedown', onPointer, true);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('blur', close);
    };
  }, [menu]);

  if (!menu) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={menu.title || 'Actions'}
      className="fixed z-50 min-w-52 max-w-72 rounded-xl panel panel-menu shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-1"
      style={{ left: `${menu.x}px`, top: `${menu.y}px` }}
      // Stopped as well as cancelled: the page behind opens its own menu on a
      // right-click, and would replace this one with it.
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {menu.title && (
        <div className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
          {menu.title}
        </div>
      )}
      {menu.items.map((item, i) => (
        item === 'separator' ? (
          <div key={`sep${i}`} role="separator" className="my-1 mx-1.5 h-px bg-black/10 dark:bg-white/10" />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            title={item.title}
            className={`flex w-full items-center gap-2.5 text-left px-2.5 py-1.5 rounded-lg text-sm transition-colors focus:outline-hidden enabled:hover:bg-black/5 enabled:focus:bg-black/5 dark:enabled:hover:bg-white/10 dark:enabled:focus:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed ${
              item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'
            }`}
            onClick={() => {
              onClose();
              if (item.onClick) item.onClick();
            }}
          >
            {/* The column is kept for an item without an icon too, so the
                labels of a menu line up whichever of them have one. */}
            <span className="w-4 h-4 shrink-0 flex items-center justify-center">
              {item.icon && <Icon icon={item.icon} size={16} />}
            </span>
            <span className="truncate">{item.label}</span>
          </button>
        )
      ))}
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
