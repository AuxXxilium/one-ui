import { h } from 'preact';
import { Icon } from '../icons';

// The top of a page: its icon on an accent tile, the way an app names itself
// by its icon, the title and a line about it - and the page's own buttons on
// the right.
//
// Takes the page as separate props, or as one `tab` object
// ({ icon, label, subtitle, warning }).
//
// The buttons are wrapped in their own flex box: justify-between spreads every
// direct child across the width, so two loose buttons would put one at the
// right edge and strand the other in the middle.
const PageHeader = ({ tab, icon = tab?.icon, title = tab?.label, subtitle = tab?.subtitle, warning = tab?.warning, children }) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="flex items-center gap-4 min-w-0">
      {icon && (
        // text-on-accent: white on the Amber preset is unreadable.
        <span className="w-11 h-11 shrink-0 rounded-2xl bg-linear-to-br from-blue-400 to-blue-600 text-on-accent shadow-md shadow-blue-500/20 flex items-center justify-center">
          <Icon icon={icon} size={22} />
        </span>
      )}
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{subtitle}</p>
        )}
        {warning && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 flex items-start gap-1.5">
            <Icon icon="warning" size={16} className="shrink-0 mt-0.5" />
            <span>{warning}</span>
          </p>
        )}
      </div>
    </div>
    {children && (
      <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
        {children}
      </div>
    )}
  </div>
);

export default PageHeader;
