import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import Sidebar, { NavBadges, badgesOf } from './Sidebar';
import AppearanceMenu, { AppearancePanel } from './AppearanceMenu';
import { ACCENT_PRESETS, swatchOf } from '../theme';
import Credits from './Credits';
import { Icon } from '../icons';

const WIDE = '(min-width: 768px)';
const isWide = () => typeof window === 'undefined' || !window.matchMedia || window.matchMedia(WIDE).matches;

// Desktop or tablet (md and up) against phone, following the window.
const useWide = () => {
  const [wide, setWide] = useState(isWide);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(WIDE);
    const on = () => setWide(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener('change', on); else mq.addListener(on);
    return () => (mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on));
  }, []);
  return wide;
};

// Closes a popup on a press outside `refs` or on Escape. Listeners only while
// it is open.
const useDismiss = (open, setOpen, refs) => {
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
                <AppearancePanel {...theme} />
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

const TitleBar = ({ logo, title, subtitle, actions, theme, account, menuButton }) => (
  <header className="shrink-0 px-4 sm:px-6 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {menuButton}
        {typeof logo === 'string' ? <img src={logo} alt="" className="h-10 w-10 shrink-0" /> : logo}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white truncate">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {actions}
        {account ? <AccountMenu account={account} theme={theme} /> : theme && <AppearanceMenu {...theme} />}
      </div>
    </div>
  </header>
);

// Phone: the pages in a compact menu that opens above the round button, with
// their bubbles.
const PageMenu = ({ nav, active, onSelect, onClose, panelRef }) => {
  const loose = nav.filter((i) => !i.section);
  const sections = [...new Set(nav.filter((i) => i.section).map((i) => i.section))];
  const item = (i) => {
    const on = !i.href && i.id === active;
    const cls = `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
      on ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-semibold' : 'text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10'
    }`;
    const inner = (
      <Fragment>
        <Icon icon={i.icon} size={20} className={on ? '' : 'text-gray-500 dark:text-gray-400'} />
        <span className="flex-1 min-w-0 truncate text-[15px]">{i.label}</span>
        <NavBadges item={i} />
        {i.href && <span className="text-xs text-gray-400 dark:text-gray-500" aria-hidden="true">↗</span>}
      </Fragment>
    );
    return i.href ? (
      <a key={i.id} href={i.href} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={onClose} className={cls}>{inner}</a>
    ) : (
      <button key={i.id} type="button" role="menuitem" onClick={() => { onClose(); onSelect(i.id); }} aria-current={on ? 'page' : undefined} className={cls}>
        {inner}
      </button>
    );
  };
  return (
    <div
      ref={panelRef}
      role="menu"
      aria-label="Pages"
      className="fixed z-40 right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] w-72 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-8rem-env(safe-area-inset-bottom))] overflow-y-auto rounded-2xl panel panel-menu shadow-2xl ring-1 ring-black/5 dark:ring-white/10 p-2 origin-bottom-right"
    >
      {loose.map(item)}
      {sections.map((s) => (
        <div key={s} className="pt-1.5">
          <div className="px-3 pt-1 pb-0.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{s}</div>
          {nav.filter((i) => i.section === s).map(item)}
        </div>
      ))}
    </div>
  );
};

// The round menu button in the bottom right corner of a phone. Its corner
// counts what waits on the pages: the red bubbles alone, pulsing, when there
// are any, else every bubble but the quiet ones.
const MenuButton = ({ nav, open, onClick, buttonRef }) => {
  const pills = nav.flatMap(badgesOf).filter((b) => b.tone !== 'quiet');
  const danger = pills.filter((b) => b.tone === 'danger');
  const count = (danger.length ? danger : pills).reduce((a, b) => a + (Number(b.n) || 0), 0);
  const title = pills.map((b) => b.title).filter(Boolean).join(' · ');
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close the menu' : 'Open the menu'}
      aria-expanded={open}
      title={title || undefined}
      className="fixed z-40 right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] w-14 h-14 rounded-full flex items-center justify-center bg-blue-500 text-on-accent shadow-lg shadow-black/25 ring-1 ring-black/10 active:scale-95 transition-transform"
    >
      <Icon icon={open ? 'close' : 'menu'} size={24} />
      {!open && count > 0 && (
        <span className={`absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full text-[10px] font-bold leading-5 text-center tabular-nums ring-2 ring-white dark:ring-gray-900 ${danger.length ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-blue-700'}`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

// The whole frame of an app: a title bar across the top, the page list and
// the page itself, all on the accent-washed ground.
//
// The title bar has no background of its own: it sits on the wash with the
// sidebar, the way a desktop app's title bar does, so the cards are the only
// white on the page.
//
// Desktop and tablet (md and up): the page list is the Sidebar down the left,
// narrowed to icons by the ☰ button, and the page scrolls in its own column.
//
// Phone: the whole page scrolls as one document, so nothing hides behind a
// mobile browser's toolbar, and the safe areas are kept free. The pages are
// in a compact menu that opens above a round button in the bottom right
// corner, with their bubbles; the button counts them. It sits below dialogs
// (z-50), so it never covers a dialog's buttons.
//
//   logo, title, subtitle   the app's name in the title bar (logo: an image
//                           URL or anything to render)
//   actions                 extra buttons beside the appearance menu
//   theme                   what useTheme returns; adds the appearance menu
//   account                 the user's menu top right, in place of the
//                           separate appearance menu (see AccountMenu):
//                           { name, subtitle?, tag?, extra?, initials?,
//                           label?, items: [{ label, icon?, onClick,
//                           tone? }] } - tone 'danger' for Sign out
//   nav, active, onSelect   the Sidebar's items (with their badge bubbles)
//                           and the current page
//   credits                 the One UI credit at the foot of the sidebar, or
//                           of the page on a phone; on by default, see
//                           NOTICE before turning it off
const AppShell = ({ logo, title, subtitle, actions, theme, account, nav = [], active, onSelect, credits = true, children }) => {
  const wide = useWide();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menu, setMenu] = useState(false);
  const panel = useRef(null);
  const fab = useRef(null);
  useDismiss(menu, setMenu, [panel, fab]);
  useEffect(() => { if (wide) setMenu(false); }, [wide]);

  const bar = { logo, title, subtitle, actions, theme, account };

  if (wide) {
    return (
      <div className="flex h-dvh flex-col app-wash text-gray-900 dark:text-gray-100">
        <TitleBar
          {...bar}
          menuButton={nav.length > 0 && (
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
            >
              <Icon icon="menu" size={22} />
            </button>
          )}
        />
        <div className="flex flex-1 overflow-hidden min-h-0">
          {nav.length > 0 && (
            <Sidebar items={nav} active={active} onSelect={onSelect} open={sidebarOpen} footer={credits ? <Credits compact /> : null} />
          )}
          <main className="flex-1 min-w-0 overflow-auto p-4 sm:p-6 sm:pl-3">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh app-wash text-gray-900 dark:text-gray-100">
      <TitleBar {...bar} />
      {/* Room below the last card for the menu button and the home indicator. */}
      <main className={`min-w-0 px-4 pt-2 ${nav.length > 0 ? 'pb-[calc(6rem+env(safe-area-inset-bottom))]' : 'pb-[calc(1.5rem+env(safe-area-inset-bottom))]'}`}>
        {children}
        {credits && <div className="pt-6 text-center text-xs text-gray-500"><Credits compact /></div>}
      </main>
      {nav.length > 0 && (
        <Fragment>
          {menu && <PageMenu nav={nav} active={active} onSelect={onSelect} onClose={() => setMenu(false)} panelRef={panel} />}
          <MenuButton nav={nav} open={menu} onClick={() => setMenu(!menu)} buttonRef={fab} />
        </Fragment>
      )}
    </div>
  );
};

export default AppShell;
