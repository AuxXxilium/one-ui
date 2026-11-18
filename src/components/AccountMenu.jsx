import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { AppearancePanel } from './AppearanceMenu';
import { ACCENT_PRESETS, swatchOf } from '../theme';
import { Icon } from '../icons';

// Closes a popup on a press outside `refs` or on Escape. Listeners only while
// it is open.
export const useDismiss = (open, setOpen, refs) => {
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!refs.some((r) => r.current && r.current.contains(e.target))) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
};

const initials = (name) => {
  const p = String(name || '?').trim().split(/\s+/);
  return ((p.length > 1 ? p[0][0] + p[p.length - 1][0] : p[0].slice(0, 2)) || '?').toUpperCase();
};

const avatar = 'shrink-0 rounded-full bg-linear-to-br from-blue-400 to-blue-600 text-on-accent font-bold flex items-center justify-center';

const MenuItem = ({ icon, tone, onClick, children }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors ${
      tone === 'danger' ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10'
    }`}
  >
    {icon && <Icon icon={icon} size={16} className={tone === 'danger' ? '' : 'text-gray-500 dark:text-gray-400'} />}
    {children}
  </button>
);

// The user's menu, top right: their initials on an accent disc with the name
// and a chevron beside it (only the disc on a phone). It opens on a card of
// who is signed in - the disc, name, a tag such as Admin, a subtitle and
// anything the app adds (a level, a quota) - then, with a theme, an
// Appearance row that turns the menu into the appearance choices and back,
// then the app's own entries. Entries with tone 'danger' (Sign out) come
// last, set apart in red.
const AccountMenu = ({ account, theme }) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('main'); // 'main', or 'look' for the appearance choices
  const wrap = useRef(null);
  useDismiss(open, setOpen, [wrap]);
  const items = account.items || [];
  const plain = items.filter((it) => it.tone !== 'danger');
  const danger = items.filter((it) => it.tone === 'danger');
  const letters = account.initials || initials(account.name);
  const swatch = theme && (theme.presets || ACCENT_PRESETS).find((p) => p.id === theme.accent);
  const pick = (it) => () => { setOpen(false); if (it.onClick) it.onClick(); };
  const rule = <div className="my-1.5 border-t border-black/5 dark:border-white/10" />;
  return (
    <div className="relative shrink-0" ref={wrap}>
      <button
        type="button"
        onClick={() => { setView('main'); setOpen(!open); }}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={account.label || 'Account'}
        className="flex items-center gap-2 pl-1 pr-1 sm:pr-2 py-1 rounded-xl hover:bg-white/70 dark:hover:bg-white/10 transition-colors"
      >
        <span className={`${avatar} w-8 h-8 text-xs`}>{letters}</span>
        <span className="hidden sm:block text-sm font-medium text-gray-800 dark:text-white max-w-32 truncate">{account.name}</span>
        <Icon icon="chevronDown" size={14} className="hidden sm:block text-gray-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl panel panel-menu shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-1.5 z-40" role="menu">
          <div className="p-2.5 mb-1.5 rounded-lg bg-linear-to-br from-blue-500/15 to-transparent dark:from-blue-400/15">
            <div className="flex items-center gap-3">
              <span className={`${avatar} w-10 h-10 text-sm shadow-sm`}>{letters}</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{account.name}</div>
                {(account.tag || account.subtitle) && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                    {account.tag && <span className="shrink-0 px-1.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-semibold uppercase tracking-wide">{account.tag}</span>}
                    {account.subtitle && <span className="truncate">{account.subtitle}</span>}
                  </div>
                )}
              </div>
            </div>
            {account.extra && <div className="mt-3">{account.extra}</div>}
          </div>
          {view === 'look' && theme ? (
            <div className="grid gap-1.5" role="group" aria-label="Appearance">
              <button
                type="button"
                onClick={() => setView('main')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-semibold text-left text-gray-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <Icon icon="chevronLeft" size={16} className="text-gray-400" />Appearance
              </button>
              <div className="px-2.5 pb-1 grid gap-1.5">
                <AppearancePanel {...theme} onDone={() => setOpen(false)} />
              </div>
            </div>
          ) : (
            <Fragment>
              {theme && (
                <MenuItem icon={theme.dark ? 'moon' : 'sun'} onClick={() => setView('look')}>
                  <span className="flex-1">Appearance</span>
                  {swatch && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: swatchOf(swatch) }} />}
                  <Icon icon="chevronRight" size={14} className="text-gray-400" />
                </MenuItem>
              )}
              {theme && plain.length > 0 && rule}
              {plain.map((it) => <MenuItem key={it.label} icon={it.icon} onClick={pick(it)}>{it.label}</MenuItem>)}
              {danger.length > 0 && (theme || plain.length > 0) && rule}
              {danger.map((it) => <MenuItem key={it.label} icon={it.icon} tone="danger" onClick={pick(it)}>{it.label}</MenuItem>)}
            </Fragment>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
