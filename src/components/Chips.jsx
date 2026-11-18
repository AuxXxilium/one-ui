import { h, Fragment } from 'preact';
import StatusBadge from './StatusBadge';
import { Icon } from '../icons';

// A row of figures as badges, in place of a sentence: "3 online" green,
// "1 away" grey, "↓ 1.5 MB/s" in the accent. From Firevisor.
//
// Each item is { label, status, icon, flip, title, mono, tone }. A falsy item
// is left out, so a figure that does not apply is written `cond && {...}`.
//
//   status   as StatusBadge's: success, warning, error - fixed whatever the
//            accent - info for a reading in the accent, nothing for a count
//   icon     a name from ICONS before the label; flip turns it over (an
//            arrowUp drawn as a down arrow)
//   mono     the label in the typewriter face, for a code or a module name
//   tone     a class list in place of a status, for a colour of its own that
//            is not a status (a user's role)
//
//   joined   the figures of ONE thing as one pill, its segments divided by a
//            thin rule - ( 13 GB free | 14 GB usable ), ( ↓ 1.5 KB/s | ↑ 5.5 KB/s )
//            - rather than separate pills that read as separate things. Each
//            segment keeps its own colour. A list of separate things stays
//            separate pills.
//   small    the size for a box's header line: 10 px, no vertical padding
//
// In dark mode the accent's badge is a step lighter than StatusBadge's own:
// with a dark accent shade (amber's 900 is a brown) its tint all but vanished
// on the card, and a rate read as loose text beside pills.
const INFO_DARK = 'dark:bg-blue-500/20! dark:text-blue-300!';
const SMALL_BADGE = 'py-0! text-[10px]!';

const SEG = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const Chips = ({ items, className = '', joined = false, small = false }) => {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  const inner = (c) => (
    <Fragment>
      {c.icon && <Icon icon={c.icon} size={small ? 10 : 11} className={c.flip ? 'rotate-180' : ''} />}
      {c.label}
    </Fragment>
  );
  if (joined && list.length > 1) {
    return (
      <span className={`inline-flex items-stretch rounded-full overflow-hidden font-medium tabular-nums whitespace-nowrap divide-x divide-black/10 dark:divide-white/10 ${
        small ? 'text-[10px] leading-[1.34] shrink-0' : 'text-xs'} ${className}`}>
        {list.map((c, i) => (
          <span
            key={`${i}-${c.label}`}
            title={c.title}
            className={`inline-flex items-center gap-1 px-2 ${small ? '' : 'py-0.5'} ${c.mono ? 'font-mono' : ''} ${c.tone || SEG[c.status] || SEG.default}`}
          >
            {inner(c)}
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${small ? 'shrink-0' : ''} ${className}`}>
      {list.map((c, i) => (c.tone ? (
        <span
          key={`${i}-${c.label}`}
          title={c.title}
          className={`inline-flex items-center gap-1 px-2 rounded-full font-medium whitespace-nowrap ${small ? 'text-[10px]' : 'py-0.5 text-xs'} ${c.mono ? 'font-mono' : ''} ${c.tone}`}
        >
          {inner(c)}
        </span>
      ) : (
        <StatusBadge
          key={`${i}-${c.label}`}
          status={c.status}
          title={c.title}
          className={`px-2! font-medium! tabular-nums ${c.status === 'info' ? INFO_DARK : ''} ${small ? SMALL_BADGE : ''} ${c.mono ? 'font-mono!' : ''}`}
        >
          {inner(c)}
        </StatusBadge>
      )))}
    </span>
  );
};

export default Chips;
