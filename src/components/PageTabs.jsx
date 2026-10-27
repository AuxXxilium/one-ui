import { h } from 'preact';
import { Icon } from '../icons';

// The views of one sidebar entry - Monitoring's System, Resources, Network -
// across the top of the page in equal parts. The selected view on white with
// the accent line along its foot, the others on the band's tint. On a phone
// the tabs keep their full names and scroll sideways.
//
// items: [{ id, label, icon?, count? }]
const PageTabs = ({ items, value, onChange }) => (
  <div
    role="tablist"
    className="flex overflow-x-auto sm:grid sm:overflow-hidden rounded-2xl bg-gray-200/50 dark:bg-gray-900/30"
    style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
  >
    {items.map((t, i) => {
      const on = t.id === value;
      return (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={on}
          onClick={() => onChange(t.id)}
          className={`relative shrink-0 sm:shrink px-3 py-2.5 flex items-center justify-center gap-2 sm:min-w-0 whitespace-nowrap text-sm font-semibold transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
            i > 0 ? 'border-l border-gray-200/80 dark:border-gray-700/70' : ''
          } ${on
            ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300'
            : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/5'}`}
        >
          {t.icon && <Icon icon={t.icon} size={16} className="shrink-0" />}
          <span className="truncate">{t.label}</span>
          {t.count != null && <span className="text-xs text-gray-400 tabular-nums">{t.count}</span>}
          {on && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 dark:bg-blue-400" aria-hidden="true" />}
        </button>
      );
    })}
  </div>
);

export default PageTabs;
