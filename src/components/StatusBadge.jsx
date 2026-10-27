import { h } from 'preact';

// Status colours stay fixed whatever the accent: green is running and red is
// failed under every theme. `info` is the one that follows the accent.
const STYLES = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

// text-xs: a badge qualifies the thing beside it, so it must not be the same
// size as that thing. The text is `label` or the children; title is the
// hover text, for the detail a single word cannot carry.
const StatusBadge = ({ status = 'default', label, title, children, className = '' }) => (
  <span
    title={title}
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${STYLES[status] || STYLES.default} ${className}`}
  >
    {label ?? children}
  </span>
);

export const Badge = StatusBadge;

export default StatusBadge;
