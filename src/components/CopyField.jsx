import { h } from 'preact';
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';

// Copy text to the clipboard. navigator.clipboard needs a secure context,
// and these apps are often reached over plain http on a LAN address, so the
// old execCommand('copy') way is kept as the fallback rather than the button
// silently doing nothing on exactly those setups.
export const copyText = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {
    // Permission denied: fall through to the textarea method.
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    // Out of view but still selectable: display:none could not be selected.
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
};

// A value that copies itself when clicked. Only the value is copied, not the
// label, so it can be pasted straight into an address bar or a config field.
const CopyField = ({ label, value, className = '' }) => {
  const [state, setState] = useState(''); // '' | 'copied' | 'failed'
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Stopped here so the field is safe inside a <label>, where a click would
  // otherwise also toggle the label's checkbox.
  const onCopy = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyText(value);
    setState(ok ? 'copied' : 'failed');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState(''), ok ? 1500 : 2500);
  }, [value]);

  if (!value) return null;

  return (
    <div className={`flex items-center gap-2 p-2 bg-gray-100/60 dark:bg-gray-900/40 rounded-xl ${className}`}>
      {label && (
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">{label}</span>
      )}
      <button
        type="button"
        onClick={onCopy}
        title="Click to copy"
        className="text-xs font-mono text-gray-900 dark:text-white break-all text-left rounded-sm px-1 -mx-1 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
      >
        {value}
      </button>
      {/* aria-live announces the result without moving focus off the button. */}
      <span
        aria-live="polite"
        className={`text-xs shrink-0 ml-auto transition-opacity ${state ? 'opacity-100' : 'opacity-0'} ${
          state === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
        }`}
      >
        {state === 'failed' ? 'Press Ctrl+C' : state === 'copied' ? 'Copied' : ''}
      </span>
    </div>
  );
};

export default CopyField;
