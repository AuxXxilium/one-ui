import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Icon } from '../../icons';
import { useDismiss } from '../AccountMenu';
import { APP_MIME } from './state';

// The bar across the top of the desktop: a launcher with every page of the
// app, the open windows as pills - the one in front lifted out in white, as
// the sidebar marks the current page, a minimised one just its label - the
// app's own controls (`tray`: the account menu, notifications), a clock that
// opens a calendar, and Show desktop at the end. Solid or glass with the rest
// of the app (.oui-bar in one-ui.css).

// The pages with no section first, then each section in the order it first
// appears, as the sidebar groups them.
const groupApps = (apps, label) => {
  const groups = [];
  const loose = apps.filter((a) => !a.section);
  if (loose.length) groups.push({ name: '', label, apps: loose });
  apps.forEach((a) => {
    if (!a.section) return;
    let g = groups.find((x) => x.name === a.section);
    if (!g) { g = { name: a.section, label: a.section, apps: [] }; groups.push(g); }
    g.apps.push(a);
  });
  return groups;
};

const AppGlyph = ({ app, size, className = '' }) => <Icon icon={app.icon} size={size} className={className} />;

// The launcher: every page, searchable, as tiles, grouped as the sidebar
// groups them. Right-click a tile for the app's menu; drag one out onto the
// desktop to put it there.
const Launcher = ({ apps, text, onOpen, onContextMenu, appMenu, onClose, footer }) => {
  const [q, setQ] = useState('');
  const input = useRef(null);
  useEffect(() => { if (input.current) input.current.focus(); }, []);
  const needle = q.trim().toLowerCase();
  const hits = needle
    ? apps.filter((a) => `${a.label} ${a.subtitle || ''} ${a.section || ''}`.toLowerCase().includes(needle))
    : apps;
  const groups = needle ? [{ name: 'results', label: text.results, apps: hits }] : groupApps(hits, text.apps);

  const tile = (app) => (
    <button
      key={app.id}
      type="button"
      onClick={() => onOpen(app.id)}
      onContextMenu={app.href ? undefined : onContextMenu(appMenu(app.id, 'launcher'))}
      draggable={!app.href}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copyMove';
        e.dataTransfer.setData(APP_MIME, app.id);
        e.dataTransfer.setData('text/plain', app.label);
        // Closed as the drag starts, so the desktop under it takes the drop.
        setTimeout(onClose, 0);
      }}
      title={app.subtitle || app.label}
      className="group flex flex-col items-center gap-1.5 p-2 rounded-xl text-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
    >
      <span className="relative w-11 h-11 rounded-2xl bg-linear-to-br from-blue-400 to-blue-600 text-on-accent shadow-md shadow-blue-500/20 flex items-center justify-center transition-transform group-hover:scale-105">
        <AppGlyph app={app} size={22} />
        {app.href && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-800 text-[9px] leading-4 text-gray-500 dark:text-gray-300 shadow-sm" aria-hidden="true">↗</span>}
      </span>
      <span className="text-xs font-medium text-gray-800 dark:text-gray-100 leading-tight line-clamp-2">{app.label}</span>
    </button>
  );

  return (
    <div className="absolute left-2 top-full mt-2 w-[min(36rem,calc(100vw-1.5rem))] rounded-2xl panel panel-menu shadow-2xl ring-1 ring-black/5 dark:ring-white/10 p-3 z-50">
      <div className="relative mb-2">
        <Icon icon="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={input}
          type="search"
          value={q}
          onInput={(e) => setQ(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && hits.length) onOpen(hits[0].id); }}
          placeholder={text.search}
          aria-label={text.search}
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white border-0 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
        />
      </div>
      <div className="max-h-[min(30rem,calc(100vh-10rem))] overflow-y-auto">
        {groups.map((g) => (
          <div key={g.name} className="pt-1">
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{g.label}</div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1">{g.apps.map(tile)}</div>
          </div>
        ))}
        {!hits.length && <p className="px-2 py-6 text-sm text-center text-gray-500 dark:text-gray-400">{text.noMatch}</p>}
      </div>
      {footer && <div className="mt-2 pt-2 px-2 border-t border-black/5 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400">{footer}</div>}
    </div>
  );
};

// The first day of the week where the reader is: Intl's week info where the
// browser has it, else Sunday for US English and Monday everywhere else.
const firstWeekday = () => {
  const lang = (typeof navigator !== 'undefined' && navigator.language) || 'en';
  try {
    const loc = new Intl.Locale(lang);
    const info = (typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : loc.weekInfo) || null;
    if (info && info.firstDay) return info.firstDay % 7;
  } catch (e) { /* fall through */ }
  return /^en-US$|^en$/.test(lang) ? 0 : 1;
};

// The month around `month` (a Date on its 1st) as weeks of seven days,
// starting on the reader's first weekday.
const monthGrid = (month, first) => {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(1 - ((start.getDay() - first + 7) % 7));
  const weeks = [];
  const d = new Date(start);
  do {
    const week = [];
    for (let i = 0; i < 7; i += 1) { week.push(new Date(d)); d.setDate(d.getDate() + 1); }
    weeks.push(week);
  } while (d.getMonth() === month.getMonth());
  return weeks;
};

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const NAV_BTN = 'p-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors';

// What the clock opens: today in full and a month to page through. With
// onSettings, a button to the app's date and time settings.
const ClockPanel = ({ now, text, onSettings }) => {
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const weeks = monthGrid(month, firstWeekday());
  const dayNames = weeks[0].map((d) => d.toLocaleDateString(undefined, { weekday: 'short' }));
  const step = (n) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const thisMonth = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();
  const title = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  return (
    <div className="absolute right-2 top-full mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl panel panel-menu shadow-2xl ring-1 ring-black/5 dark:ring-white/10 p-4 z-50">
      <p className="text-3xl font-semibold tabular-nums text-gray-900 dark:text-white">
        {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between mb-2">
          {/* The first letter only: some languages write the month in lower case. */}
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title.charAt(0).toLocaleUpperCase() + title.slice(1)}</span>
          <div className="flex items-center gap-1">
            {!thisMonth && (
              <button type="button" className={`${NAV_BTN} px-2 text-xs font-medium`} onClick={() => setMonth(new Date(now.getFullYear(), now.getMonth(), 1))}>{text.today}</button>
            )}
            <button type="button" className={NAV_BTN} onClick={() => step(-1)} aria-label={text.previousMonth} title={text.previousMonth}><Icon icon="chevronLeft" size={16} /></button>
            <button type="button" className={NAV_BTN} onClick={() => step(1)} aria-label={text.nextMonth} title={text.nextMonth}><Icon icon="chevronRight" size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {dayNames.map((n, i) => <span key={`h${i}`} className="py-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">{n}</span>)}
          {weeks.flat().map((d) => (
            <span
              key={d.toISOString()}
              className={`py-1.5 text-sm tabular-nums rounded-lg ${
                sameDay(d, now)
                  ? 'bg-blue-600 text-on-accent font-semibold'
                  : d.getMonth() === month.getMonth() ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {d.getDate()}
            </span>
          ))}
        </div>
      </div>
      {onSettings && (
        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10">
          <button type="button" onClick={onSettings} className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium bg-gray-200/70 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white transition-colors">
            <Icon icon="clock" size={14} />{text.clockSettings}
          </button>
        </div>
      )}
    </div>
  );
};

// The time, on the minute, with the date as its tooltip.
const Clock = ({ text, onSettings }) => {
  const [now, setNow] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  useDismiss(open, setOpen, [wrap]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);
  // Not positioned itself: the panel hangs from the bar, below its line.
  return (
    <div ref={wrap}>
      <button
        type="button"
        onClick={() => { setNow(new Date()); setOpen(!open); }}
        aria-haspopup="true"
        aria-expanded={open}
        className={`px-2 py-1 rounded-lg text-sm tabular-nums font-medium text-gray-700 dark:text-gray-200 select-none transition-colors ${
          open ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'
        }`}
        title={now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      >
        {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </button>
      {open && <ClockPanel now={now} text={text} onSettings={onSettings && (() => { setOpen(false); onSettings(); })} />}
    </div>
  );
};

const Taskbar = ({
  apps, wins, focusedId, title, logo, text, clock, onClockSettings,
  onOpen, onPill, onPillMenu, appMenu, onContextMenu, pinned, pinnedNames,
  onBarMenu, onClosePill, onShowDesktop, tray, footer,
}) => {
  const [launcher, setLauncher] = useState(false);
  const wrap = useRef(null);
  useDismiss(launcher, setLauncher, [wrap]);
  const byId = (id) => apps.find((x) => x.id === id);
  // A taskbar button's menu opens under the bar at the pointer's x, so it
  // never covers the button it is for.
  const belowBar = (handler) => (e) => {
    const bar = e.currentTarget.closest('header');
    handler({
      clientX: e.clientX,
      clientY: bar ? bar.getBoundingClientRect().bottom + 4 : e.clientY,
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
    });
  };

  // Pinned apps first, in the order they were pinned, open or not, then every
  // other open window in the order it was opened.
  const ids = (pinned || []).filter(byId).concat(wins.map((w) => w.id).filter((id) => (pinned || []).indexOf(id) === -1));

  return (
    <header className="oui-bar relative z-[45] shrink-0 flex items-center gap-2 px-2 py-1.5">
      <div ref={wrap} className="shrink-0">
        <button
          type="button"
          onClick={() => setLauncher(!launcher)}
          aria-haspopup="true"
          aria-expanded={launcher}
          title={text.apps}
          className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl transition-colors ${launcher ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
        >
          {typeof logo === 'string' ? <img src={logo} alt="" className="h-7 w-7 rounded-lg" /> : logo}
          {title && <span className="hidden sm:block text-sm font-semibold text-gray-800 dark:text-white">{title}</span>}
          <Icon icon="apps" size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
        {launcher && (
          <Launcher
            apps={apps}
            text={text}
            appMenu={appMenu}
            onContextMenu={onContextMenu}
            onOpen={(id) => { setLauncher(false); onOpen(id); }}
            onClose={() => setLauncher(false)}
            footer={footer}
          />
        )}
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto scrollbar-none" onContextMenu={onBarMenu}>
        {ids.map((id) => {
          const app = byId(id);
          if (!app) return null;
          const w = wins.find((x) => x.id === id);
          const front = w && id === focusedId && !w.min;
          if (!w) {
            // Pinned and closed: its name dimmed, or its icon alone.
            return (
              <button
                key={id}
                type="button"
                onClick={() => onOpen(id)}
                onContextMenu={belowBar(onPillMenu(id))}
                title={app.label}
                aria-label={app.label}
                className={`shrink-0 rounded-lg flex items-center text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                  pinnedNames ? 'gap-1.5 pl-1.5 pr-3 py-1 text-sm' : 'w-8 h-8 justify-center'
                }`}
              >
                {pinnedNames ? (
                  <Fragment>
                    <span className="w-6 h-6 rounded-md flex items-center justify-center opacity-80"><AppGlyph app={app} size={16} /></span>
                    <span className="max-w-[10rem] truncate text-gray-500 dark:text-gray-400">{app.label}</span>
                  </Fragment>
                ) : <AppGlyph app={app} size={17} />}
              </button>
            );
          }
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPill(id)}
              onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}
              onAuxClick={(e) => { if (e.button === 1) { e.preventDefault(); onClosePill(id); } }}
              onContextMenu={belowBar(onPillMenu(id))}
              title={`${app.label} - ${text.middleClick}`}
              className={`relative flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-lg shrink-0 text-sm transition-colors ${
                front
                  ? 'panel shadow-sm ring-1 ring-black/5 dark:ring-white/10 text-gray-900 dark:text-white'
                  : w.min
                    ? 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <span className={`w-6 h-6 rounded-md flex items-center justify-center ${front ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                <AppGlyph app={app} size={16} />
              </span>
              <span className="max-w-[10rem] truncate">{app.label}</span>
              {/* The running mark under an open app, the accent when in front. */}
              <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full ${front ? 'w-5 bg-blue-500' : 'w-2.5 bg-gray-400 dark:bg-gray-500'}`} />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {tray}
        {clock && <Clock text={text} onSettings={onClockSettings} />}
        <button
          type="button"
          onClick={onShowDesktop}
          title={text.showDesktop}
          aria-label={text.showDesktop}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <Icon icon="showDesktop" size={18} />
        </button>
      </div>
    </header>
  );
};

export default Taskbar;
