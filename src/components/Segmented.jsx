import { h } from 'preact';

// A row of mutually exclusive views: Packages or Users, Overview or Codecs,
// which column a list sorts by. A tinted track with the selected item lifted
// out of it as a white pill - the same treatment the sidebar gives the current
// page, so "this is where you are" looks the same at both levels.
//
// The selected item is NOT painted in the accent: a view switcher is the last
// control on a page that should shout.
//
// items: [{ id, label, count?, title?, disabled? }]. count is drawn quietly
// after the label.
const Segmented = ({ items, value, onChange, className = '', size = 'sm' }) => (
  <div
    role="tablist"
    className={`flex w-fit max-w-full flex-wrap items-center gap-0.5 p-1 rounded-xl bg-gray-200/60 dark:bg-gray-800/80 ring-1 ring-inset ring-black/5 dark:ring-white/5 ${className}`}
  >
    {items.map((item) => {
      const on = item.id === value;
      return (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={on}
          title={item.title}
          disabled={item.disabled}
          onClick={() => onChange(item.id)}
          className={`whitespace-nowrap ${size === 'xs' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded-lg font-medium transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            on
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          {item.label}
          {item.count != null && (
            <span className={`ml-1.5 text-xs tabular-nums ${on ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {item.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default Segmented;
