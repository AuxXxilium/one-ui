import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import Sidebar, { NavBadges, badgesOf } from './Sidebar';
import AppearanceMenu from './AppearanceMenu';
import AccountMenu, { useDismiss } from './AccountMenu';
import Credits from './Credits';
import Toaster from './Toaster';
import MediaViewer from './MediaViewer';
import MiniPlayer from './MiniPlayer';
import Desktop from './desktop/Desktop';
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
//   overlays                the app-wide pieces every page reaches through a
//                           function rather than markup: the toasts (toast()),
//                           the lightbox and the music player (openMedia()).
//                           On by default; false leaves them to the app
//   mediaText               the lightbox's and player's words, for an app in
//                           another language (see MediaViewer, MiniPlayer)
//   wallpaper               what useWallpaper returns: drawn behind the app,
//                           and offered in the Appearance panel. Over a
//                           picture the title bar, the sidebar and page
//                           headers get a frosted ground of their own
//   layout, renderPage      what useLayout returns, and (id, open) => the page
//                           with that id. With both, the Appearance panel
//                           offers Classic and Desktop, and on Desktop every
//                           page opens in a window of its own (Desktop);
//                           `children` is the classic layout's page
//   desktop                 more options for the Desktop: storageKey,
//                           defaultIcons, onHelp, onClockSettings, text …
const AppShell = ({
  logo, title, subtitle, actions, theme, account, nav = [], active, onSelect, credits = true, overlays = true, mediaText,
  wallpaper, layout, renderPage, desktop, children,
}) => {
  const wide = useWide();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menu, setMenu] = useState(false);
  const panel = useRef(null);
  const fab = useRef(null);
  useDismiss(menu, setMenu, [panel, fab]);
  useEffect(() => { if (wide) setMenu(false); }, [wide]);

  // The Appearance panel's choices: the theme's, with the wallpapers and the
  // layouts when the app has them.
  const look = theme && { ...theme, wallpaper, layout: layout && renderPage ? layout : undefined };
  const bar = { logo, title, subtitle, actions, theme: look, account };
  const onDesktop = !!(layout && renderPage && layout.current === 'desktop' && layout.available);
  const shared = (
    <Fragment>
      {overlays && (
        <Fragment>
          <Toaster />
          <MediaViewer text={mediaText} />
          {/* Beside the sidebar, wide or narrowed, so it never covers the
              credit at its foot: the sidebar's width and the page's own left
              padding. */}
          <MiniPlayer
            text={mediaText}
            className={!onDesktop && nav.length > 0 ? (sidebarOpen ? 'md:left-[16.75rem]' : 'md:left-[5.75rem]') : ''}
          />
        </Fragment>
      )}
      {wallpaper && wallpaper.input}
    </Fragment>
  );

  if (onDesktop) {
    return (
      <div className="h-dvh text-gray-900 dark:text-gray-100">
        <Desktop
          apps={nav}
          renderApp={renderPage}
          title={title}
          logo={logo}
          wallpaper={wallpaper}
          initialApp={active}
          onFocusChange={onSelect}
          footer={credits ? <Credits compact /> : null}
          tray={(
            <Fragment>
              {actions}
              {account ? <AccountMenu account={account} theme={look} /> : look && <AppearanceMenu {...look} />}
            </Fragment>
          )}
          {...desktop}
        />
        {shared}
      </div>
    );
  }

  // The ground: the wallpaper when there is one, the soft wash otherwise.
  const wp = wallpaper ? wallpaper.current : null;
  const ground = wp ? `${wp.className || ''} ${wp.id !== 'wash' ? 'has-wallpaper' : ''}` : 'app-wash';
  const groundStyle = wp && wp.style;

  if (wide) {
    return (
      <div className={`flex h-dvh flex-col ${ground} text-gray-900 dark:text-gray-100`} style={groundStyle}>
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
        {shared}
      </div>
    );
  }

  return (
    <div className={`min-h-dvh ${ground} text-gray-900 dark:text-gray-100`} style={groundStyle && { ...groundStyle, backgroundAttachment: 'fixed' }}>
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
      {shared}
    </div>
  );
};

export default AppShell;
