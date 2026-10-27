import { h } from 'preact';
import { Icon } from '../icons';

const BASE = 'font-medium rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-1.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed';

// No button has a border: each is a fill that steps darker on hover.
const VARIANTS = {
  // text-on-accent rather than white: white on the Amber preset is 1.67:1.
  primary: 'bg-blue-600 hover:bg-blue-700 text-on-accent shadow-xs focus-visible:ring-blue-500',
  // A light tint rather than white, which on a white card would vanish.
  secondary: 'bg-gray-200/70 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white focus-visible:ring-gray-500',
  success: 'bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-500',
  danger: 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500',
  warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus-visible:ring-yellow-500',
  // The accent-coloured secondary. The name is from when it was outlined.
  outline: 'bg-blue-100 hover:bg-blue-200/70 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 focus-visible:ring-blue-500',
  // Kept for the call sites that ask for it by name: an outline button that
  // holds an icon on its own.
  icon: 'bg-blue-100 hover:bg-blue-200/70 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 focus-visible:ring-blue-500',
  // No fill until hovered, for a row of quiet actions.
  ghost: 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-white/10 focus-visible:ring-gray-500',
};

// sm is the default and sets the scale for the whole interface: a page whose
// buttons were larger than the ones people use most felt oversized.
const SIZES = {
  xs: 'px-2 py-0.5 text-xs',
  sm: 'px-2.5 py-1 text-sm',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-sm',
};

// icon: a name from ICONS (or a glyph) drawn before the label. With iconOnly
// the button shows just the icon, and its text becomes the tooltip and the
// label a screen reader announces.
const Button = ({ children, variant = 'primary', size = 'sm', icon, iconOnly = false, spin = false, className = '', ...props }) => {
  const label = iconOnly && typeof children === 'string' ? children : undefined;
  const iconSize = iconOnly ? (size === 'xs' ? 14 : 16) : size === 'xs' ? 12 : 14;
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`${BASE} ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.sm} ${iconOnly ? (size === 'xs' ? 'px-1.5!' : 'px-2!') : ''} ${className}`}
      {...props}
    >
      {icon && <Icon icon={icon} size={iconSize} className={spin ? 'shrink-0 animate-spin' : 'shrink-0'} />}
      {!iconOnly && children}
    </button>
  );
};

export default Button;
