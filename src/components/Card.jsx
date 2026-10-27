import { h } from 'preact';
import { IconTile } from '../icons';

// White on the app's wash, rounded-2xl, with neither a hairline nor a shadow:
// the fill against the wash is the edge. The title band is a neutral grey,
// fixed rather than the accent so headers stay quiet, with the icon on its
// own small tile.
//
// overflow is "hidden" so content stays inside the rounded corners; a card
// holding a dropdown passes overflow="visible" so the menu can escape it.
// The class names are written out in full: Tailwind reads the source as text,
// so a constructed "overflow-${x}" is a class it never generates.
//
// The fill is the .panel class from one-ui.css, so the whole app turns glass
// at once when the Glass surface is picked; `glass` makes just this card
// see-through.
//
// Anything not named here is spread onto the outer div, so an onClick or an
// id reaches the card instead of being dropped.
const Card = ({ title, subtitle, children, className = '', bodyClass = 'p-4', actions, icon, iconTone, iconSpin = false, overflow = 'hidden', glass = false, ...props }) => (
  <div
    {...props}
    className={`panel ${glass ? 'panel-glass' : ''} rounded-2xl ${overflow === 'visible' ? 'overflow-visible' : 'overflow-hidden'} ${className}`}
  >
    {(title || actions) && (
      // rounded-t-2xl on the band itself: a card with overflow visible does
      // not clip it, and its square corners would show past the card's.
      <div className="px-4 py-3 rounded-t-2xl bg-gray-200/50 dark:bg-gray-900/30 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          {icon && <IconTile icon={icon} tone={iconTone} spin={iconSpin} />}
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    )}
    <div className={bodyClass}>{children}</div>
  </div>
);

// The box an item sits in inside a card - a disk, a sensor, one fact - so
// items are told apart by boxes rather than by rules between rows.
export const TILE = 'bg-gray-100/60 dark:bg-gray-900/40 rounded-xl';

// One fact in a TILE: a small label above the value. mono for values that
// are codes, addresses or numbers; off for ordinary words.
export const InfoTile = ({ label, value, mono = true, className = '' }) => (
  <div className={`${TILE} px-3 py-2 ${className}`}>
    <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    <div className={`text-sm text-gray-900 dark:text-white ${mono ? 'font-mono' : 'font-medium'} wrap-break-word`}>{value}</div>
  </div>
);

export default Card;
