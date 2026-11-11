import { h, Fragment } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import { Icon } from '../icons';

// Persisted as an array of the collapsed section names, so a section added
// later starts expanded rather than inheriting a stale stored map.
const loadCollapsed = (key) => {
  try {
    const raw = JSON.parse(localStorage.getItem(key));
    return new Set(Array.isArray(raw) ? raw : []);
  } catch (e) {
    return new Set();
  }
};

// A page's notification bubbles. `badge` on a nav item is a count, or
// { n, tone?, title? }, or a list of them for several bubbles side by side
// (say, fleets out and reports unread). Tones: none for the accent, 'danger'
// (red) for what calls for attention, 'success' (green), and 'quiet' (grey)
// for something merely at work - quiet ones put no count on the phone's
// menu button. A count of 0 shows nothing.
export const badgesOf = (item) => [].concat(item?.badge ?? []).map((b) => (typeof b === 'object' ? b : { n: b })).filter((b) => b && b.n);

const PILL = {
  danger: 'bg-red-500 text-white',
  success: 'bg-emerald-600 text-white',
  quiet: 'bg-gray-200 text-gray-600 dark:bg-white/15 dark:text-gray-300',
};

export const NavBadges = ({ item }) => {
  const pills = badgesOf(item);
  if (!pills.length) return null;
  return (
    <span className="flex items-center gap-1 shrink-0">
      {pills.map((b, i) => (
        <span key={i} title={b.title} className={`min-w-5 px-1.5 rounded-full text-[11px] leading-[18px] font-semibold text-center tabular-nums ${PILL[b.tone] || 'bg-blue-600 text-on-accent'}`}>
          {b.n > 99 ? '99+' : b.n}
        </span>
      ))}
    </span>
  );
};

// The page list down the left.
//
// items: [{ id, label, icon, section?, href?, badge? }]. Items without a
// section come first; the rest are grouped under their section's heading,
// which folds when clicked. An item with href is a link out, and is never the
// current page. badge: its notification bubbles (see badgesOf); narrowed to
// icons, a dot on the icon instead - red, or the accent when all are quiet.
// A folded section shows the dot beside its count.
//
// open: full width with labels, or a narrow column of icons (and nothing at
// all on a phone).
//
// The current page is a white pill lifted off the wash, label and icon in the
// accent and an accent bar down its left edge. The bar is an inset shadow so
// it follows the pill's rounded corners. Everything else is transparent until
// hovered, so the sidebar reads as part of the ground, not a second panel.
//
// The pill is a .panel, so it turns glass with the cards. The bar is drawn on
// an ::after covering the pill rather than on the pill itself: glass lays its
// tint on a layer over everything the box draws, and a bar under it would
// come out washed.
const Sidebar = ({ items, active, onSelect, open = true, storageKey = 'sidebarCollapsedSections', footer }) => {
  const [collapsed, setCollapsed] = useState(() => loadCollapsed(storageKey));

  const toggleSection = useCallback((section) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section); else next.add(section);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch (e) {
        // Remembering it across reloads is lost; the collapse still applies.
      }
      return next;
    });
  }, [storageKey]);

  const loose = items.filter((item) => !item.section);
  const sections = [...new Set(items.filter((item) => item.section).map((item) => item.section))];

  const itemClass = (isActive) => `group w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors duration-150 ${
    isActive
      ? 'panel relative ring-1 ring-black/5 dark:ring-white/5 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] after:absolute after:inset-0 after:rounded-[inherit] after:pointer-events-none after:shadow-[inset_4px_0_0_0_rgb(var(--accent-500)/0.65)] dark:after:shadow-[inset_4px_0_0_0_rgb(var(--accent-400)/0.65)]'
      : 'hover:bg-white/60 dark:hover:bg-white/5'
  } ${open ? '' : 'justify-center'}`;

  const dot = (pills) => (
    <span className={`w-2.5 h-2.5 rounded-full ${pills.some((b) => b.tone !== 'quiet') ? 'bg-red-500' : 'bg-blue-500'}`} />
  );

  const renderItem = (item) => {
    const isActive = !item.href && item.id === active;
    const pills = badgesOf(item);
    const inner = (
      <Fragment>
        <span
          className={`relative flex items-center justify-center shrink-0 w-8 h-8 transition-colors ${
            isActive
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
          }`}
        >
          <Icon icon={item.icon} size={20} />
          {!open && pills.length > 0 && <span className="absolute -top-0.5 -right-0.5 flex">{dot(pills)}</span>}
        </span>
        {open && (
          <span className="flex-1 flex items-center justify-between gap-2 min-w-0">
            <span className={`text-[15px] leading-tight truncate ${isActive ? 'font-semibold text-blue-700 dark:text-blue-300' : 'font-medium text-gray-700 dark:text-gray-200'}`}>
              {item.label}
            </span>
            <NavBadges item={item} />
            {item.href && <span className="text-xs text-gray-400 dark:text-gray-500" aria-hidden="true">↗</span>}
          </span>
        )}
      </Fragment>
    );

    if (item.href) {
      return (
        <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" title={open ? undefined : item.label} className={itemClass(false)}>
          {inner}
        </a>
      );
    }
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelect(item.id)}
        title={open ? undefined : item.label}
        aria-current={isActive ? 'page' : undefined}
        className={itemClass(isActive)}
      >
        {inner}
      </button>
    );
  };

  return (
    <aside className={`transition-all duration-300 ease-in-out flex flex-col shrink-0 overflow-hidden ${open ? 'w-64' : 'w-0 md:w-20'}`}>
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {loose.length > 0 && <div className="space-y-0.5 pb-2">{loose.map(renderItem)}</div>}
        {sections.map((section) => {
          const sectionItems = items.filter((item) => item.section === section);
          // The section holding the current page stays open, so something on
          // screen is always marked as current. Folding only applies while the
          // sidebar is wide: narrowed, there is no heading to unfold it with.
          const holdsActive = sectionItems.some((item) => item.id === active);
          const isCollapsed = open && collapsed.has(section) && !holdsActive;
          const bodyId = `sidebar-section-${section.toLowerCase().replace(/\s+/g, '-')}`;
          return (
            <div key={section} className="pt-2">
              {open ? (
                <button
                  type="button"
                  onClick={() => toggleSection(section)}
                  aria-expanded={!isCollapsed}
                  aria-controls={bodyId}
                  className="w-full flex items-center gap-1.5 px-3 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Icon icon="chevronDown" size={10} className={`shrink-0 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                  <span className="flex-1 text-left">{section}</span>
                  {isCollapsed && sectionItems.some((item) => badgesOf(item).length) && dot(sectionItems.flatMap(badgesOf))}
                  {isCollapsed && (
                    <span className="text-[10px] font-normal normal-case tracking-normal">{sectionItems.length}</span>
                  )}
                </button>
              ) : (
                <div className="mx-auto my-2 w-8 border-t border-gray-300/70 dark:border-gray-700" />
              )}
              {!isCollapsed && (
                <div id={bodyId} className="space-y-0.5">
                  {sectionItems.map(renderItem)}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {open && footer && <div className="px-6 py-3">{footer}</div>}
    </aside>
  );
};

export default Sidebar;
