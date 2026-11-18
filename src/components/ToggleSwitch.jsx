import { h } from 'preact';

// arc-control's switch: a 44 x 24 track with a white knob, the accent when on.
// The small one is for a toolbar or a text-xs line.
const SIZES = {
  md: { track: 'h-6 w-11', knob: 'h-5 w-5', on: 'translate-x-5' },
  sm: { track: 'h-5 w-9', knob: 'h-4 w-4', on: 'translate-x-4' },
};

// An on/off switch, for settings that apply as soon as they are flipped.
// Picking items from a list stays a checkbox: that is choosing, not switching
// something on (one-ui.css draws those).
//
//   checked, onChange(next), disabled
//   size        'md' (default, a text-sm line) or 'sm' (a toolbar, text-xs)
//   label       what a screen reader announces when no visible text names it
//   children    the switch's name, drawn beside it; the name is clickable too
const ToggleSwitch = ({ checked, onChange, disabled, label, size = 'md', className = '', children }) => {
  const s = SIZES[size] || SIZES.md;
  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={children ? undefined : label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex ${s.track} shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
        checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${children ? '' : className}`}
    >
      <span
        className={`pointer-events-none inline-block ${s.knob} rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? s.on : 'translate-x-0'
        }`}
      />
    </button>
  );
  if (!children) return toggle;
  // A label around the button: a click on the name presses the switch, and
  // the name is what a screen reader reads for it.
  return (
    <label className={`inline-flex items-start gap-3 ${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-700 dark:text-gray-300 ${disabled ? 'cursor-default' : 'cursor-pointer'} ${className}`}>
      {toggle}
      {/* pt-0.5 sets the first line level with the knob; a second line, a
          hint under the name, runs on below. */}
      <span className="min-w-0 pt-0.5 select-none">{children}</span>
    </label>
  );
};

export default ToggleSwitch;
