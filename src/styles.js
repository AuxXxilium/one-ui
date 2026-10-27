// Shared form control styling, as class strings for markup that is not a
// component of its own.
//
// py-1 is Button's own padding, so an input and a button on the same line are
// the same height. No outline: a field is told apart by its fill, and the
// ring marks the one being typed in.
export const inputClass =
  'w-full px-2.5 py-1 text-sm rounded-lg border-0 ' +
  'bg-gray-200/60 dark:bg-gray-700 text-gray-900 dark:text-white ' +
  'focus:outline-hidden focus:ring-2 focus:ring-blue-500';

// A field label. Smaller than the value it labels, because the value is what
// is being read.
export const labelClass =
  'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5';

// The explanatory line under a field.
export const hintClass = 'text-xs text-gray-500 dark:text-gray-500 mt-0.5';
