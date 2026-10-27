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
// OneUI.setGlass(true).
import {
  ACCENT_PRESETS, applyAccent, applyDark, applyGlass, readStoredAccent, readStoredDark, readStoredGlass, storeValue,
} from '../src/theme';

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

window.OneUI = {
  presets: ACCENT_PRESETS,
  setDark(on) { storeValue(DARK_KEY, !!on); applyAll(); },
  setAccent(id) { storeValue(ACCENT_KEY, id); applyAll(); },
  setGlass(on) { storeValue(GLASS_KEY, !!on); applyAll(); },
  get dark() { return readStoredDark(DARK_KEY); },
  get accent() { return readStoredAccent(ACCENT_KEY, DEFAULT); },
  get glass() { return readStoredGlass(GLASS_KEY); },
};
