import { h } from 'preact';
import { Icon } from '../icons';

// The top of a page: its icon on an accent tile, the way an app names itself
// by its icon, the title and a line about it - and the page's own buttons on
// the right.
//
// Takes the page as separate props, or as one `tab` object
// ({ icon, label, subtitle, warning }).
//
//   onHelp     adds a "?" at the end of the buttons, for the page's help.
//              Explanations a reader needs once belong there, behind the "?",
//              rather than on the page every time (from Firevisor).
//   helpLabel  its tooltip and accessible name, "Help" by default
//   tabs       the way to the page's other views - a <PageTabs> or a
//              <Segmented> - drawn right under the header: the page's name
//              first, then the way to its siblings. Above the header the
//              switcher read as the page's title.
//
// The buttons are wrapped in their own flex box: justify-between spreads every
// direct child across the width, so two loose buttons would put one at the
// right edge and strand the other in the middle. A long title cannot squeeze
// them: the row wraps and they take a line of their own, right-aligned,
// wrapping again inside it on a narrow screen, while the text keeps a readable
// measure (basis-64) rather than going a word per line.
const PageHeader = ({
  tab, icon = tab?.icon, title = tab?.label, subtitle = tab?.subtitle, warning = tab?.warning,
  onHelp, helpLabel = 'Help', tabs, children,
}) => {
  const head = (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex items-center gap-4 min-w-0 flex-1 basis-64">
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
      {(children || onHelp) && (
        <div className="flex flex-wrap items-center justify-end gap-2 min-w-0 max-w-full ml-auto">
          {children}
          {onHelp && (
            // A question mark rather than a glyph: it is what people look for.
            // As tall as a Button and square.
            <button
              type="button"
              onClick={onHelp}
              title={helpLabel}
              aria-label={helpLabel}
              className="inline-flex items-center justify-center w-[2.125rem] py-1 text-sm font-semibold rounded-lg bg-gray-200/70 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              ?
            </button>
          )}
        </div>
      )}
    </div>
  );
  if (!tabs) return head;
  // One box for both, so a page's space-y puts its gap after the tabs and
  // not between them and the header they belong to.
  return (
    <div>
      {head}
      <div className="mt-4">{tabs}</div>
    </div>
  );
};

export default PageHeader;
