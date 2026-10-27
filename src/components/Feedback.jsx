import { h } from 'preact';
import { Icon } from '../icons';

// The ways a page tells someone how things stand: waiting, nothing there, a
// message, and how far along something is. One markup each, so the same wait
// never looks like two different things on pages a click apart.

// A spinner over a message, centred. The ring is three sides in a light shade
// of the accent and the fourth in a strong one, spun. `size` is the diameter
// on Tailwind's scale: 16 for a whole panel, 10 in a dialog, 6 inline.
const SPINNER = {
  6: 'w-6 h-6 border-2',
  8: 'w-8 h-8 border-2',
  10: 'w-10 h-10 border-4',
  16: 'w-16 h-16 border-4',
};

export const Loading = ({ message, size = 16, className = '' }) => (
  // role="status" so the message is announced when it appears; the ring is
  // decorative.
  <div role="status" className={`flex flex-col items-center justify-center py-12 space-y-4 ${className}`}>
    <div
      className={`inline-block ${SPINNER[size] || SPINNER[16]} border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin`}
      aria-hidden="true"
    />
    {message && <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>}
  </div>
);

// Nothing to show: an icon and a line, centred and quiet.
export const Empty = ({ icon = 'info', children, className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400 text-center ${className}`}>
    <Icon icon={icon} size={22} className="text-gray-400" />
    {children}
  </div>
);

// A message in a tinted box. info follows the accent; the others keep their
// status colour under every theme. onClose adds a close button.
const NOTICE_TONES = {
  info: 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  success: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  warning: 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
  error: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300',
};
const NOTICE_ICONS = { info: 'info', success: 'success', warning: 'warning', error: 'error' };

export const Notice = ({ tone = 'info', icon, title, children, className = '', onClose }) => (
  <div role={tone === 'error' ? 'alert' : undefined} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${NOTICE_TONES[tone] || NOTICE_TONES.info} ${className}`}>
    <Icon icon={icon || NOTICE_ICONS[tone] || 'info'} size={16} className="shrink-0 mt-0.5" />
    <div className="min-w-0 flex-1">
      {title && <div className="font-semibold">{title}</div>}
      {children}
    </div>
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        title="Close"
        className="shrink-0 -my-0.5 -mr-1 p-0.5 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
      >
        <Icon icon="close" size={16} />
      </button>
    )}
  </div>
);

// A thin bar filled to `value`, from 0 to 1 (0.42 is 42%). tone is the fill:
// the accent by default, or a status colour such as bg-red-500.
export const ProgressBar = ({ value, tone = 'bg-blue-500', className = '' }) => (
  <div
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(Math.max(0, Math.min(1, value)) * 100)}
    className={`h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden ${className}`}
  >
    <div
      className={`h-full rounded-full ${tone} transition-[width] duration-500 ease-out`}
      style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
    />
  </div>
);

export default Loading;
