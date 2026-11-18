// The theme for plain pages, built into one-ui-plain.js (npm run build).
//
// Loaded with a plain <script> in the page's <head>, before the body paints,
// so a dark page does not flash white. It applies what the apps apply - the
// stored mode, colour and surface - from the same preset table as the
// Tailwind preset, so a preset added to src/theme.js reaches plain pages too.
//
//   <script src="one-ui-plain.js"
//           data-accent-key="accentColor" data-dark-key="darkMode"
//           data-default-accent="blue"></script>
//
// All the data- attributes are optional. window.OneUI lets the page change
// the look itself: OneUI.setDark(true), OneUI.setAccent('amber'),
// OneUI.setGlass(true) - and confirm something: OneUI.toast('Saved.').
import {
  ACCENT_PRESETS, applyAccent, applyDark, applyGlass, readStoredAccent, readStoredDark, readStoredGlass, storeValue,
} from '../src/theme';
import { toast, dismissToast, subscribeToasts } from '../src/toast';

const opts = (document.currentScript && document.currentScript.dataset) || {};
const ACCENT_KEY = opts.accentKey || 'accentColor';
const DARK_KEY = opts.darkKey || 'darkMode';
const GLASS_KEY = opts.glassKey || 'surfaceGlass';
const DEFAULT = opts.defaultAccent || 'blue';

function applyAll() {
  applyDark(readStoredDark(DARK_KEY));
  applyAccent(readStoredAccent(ACCENT_KEY, DEFAULT), DEFAULT);
  applyGlass(readStoredGlass(GLASS_KEY));
}

applyAll();

// Follow the other windows live: the storage event fires in every OTHER
// window on the origin when a key changes, so switching the look in the main
// app repaints a page that is already open beside it.
window.addEventListener('storage', (e) => {
  if (e.key === null || e.key === DARK_KEY || e.key === ACCENT_KEY || e.key === GLASS_KEY) applyAll();
});

// The toasts, drawn into one .oui-toasts box at the end of the body: the same
// queue the apps' Toaster draws (src/toast.js), three seconds each, a click
// dismisses one. Built on the first toast, since this script runs in the
// <head> before there is a body.
let toastBox = null;
const drawToasts = (list) => {
  if (!toastBox) {
    if (!list.length || !document.body) return;
    toastBox = document.createElement('div');
    toastBox.className = 'oui-toasts';
    toastBox.setAttribute('role', 'status');
    toastBox.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastBox);
  }
  toastBox.replaceChildren(...list.map((x) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = x.kind === 'info' ? 'oui-toast oui-toast-info' : 'oui-toast';
    b.textContent = x.message;
    b.addEventListener('click', () => dismissToast(x.id));
    return b;
  }));
};
subscribeToasts(drawToasts);

window.OneUI = {
  presets: ACCENT_PRESETS,
  // OneUI.toast('Saved.') or OneUI.toast('Synced', 'info').
  toast,
  setDark(on) { storeValue(DARK_KEY, !!on); applyAll(); },
  setAccent(id) { storeValue(ACCENT_KEY, id); applyAll(); },
  setGlass(on) { storeValue(GLASS_KEY, !!on); applyAll(); },
  get dark() { return readStoredDark(DARK_KEY); },
  get accent() { return readStoredAccent(ACCENT_KEY, DEFAULT); },
  get glass() { return readStoredGlass(GLASS_KEY); },
};
