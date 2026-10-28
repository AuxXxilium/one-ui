import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { ACCENT_PRESETS, swatchOf } from '../theme';
import { Icon } from '../icons';

const ModeButton = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] transition-colors ${
      active
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
        : 'bg-black/5 text-gray-900 dark:bg-white/10 dark:text-white hover:bg-black/10 dark:hover:bg-white/15'
    }`}
  >
    <Icon icon={icon} size={16} />{label}
  </button>
);

// Light/dark and the accent behind one sun/moon button: Mode as two buttons, Color as a row of dots with the one in use
// ringed. Takes what useTheme returns: <AppearanceMenu {...theme} />.
//
// Surface - solid or glass boxes - shows only when setGlass is passed, so an
// app that does not offer glass does not get the row.
const AppearanceMenu = ({ dark, setDark, accent, setAccent, glass, setGlass, presets = ACCENT_PRESETS }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close on an outside click or Escape. Listeners only while open.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-white/70 dark:hover:bg-white/10 transition-colors"
        aria-label="Appearance"
        aria-haspopup="true"
        aria-expanded={open}
        title="Appearance"
      >
        <Icon icon={dark ? 'sun' : 'moon'} size={20} className={dark ? 'text-yellow-500' : 'text-gray-600'} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 min-w-[200px] grid gap-1.5 rounded-xl panel panel-menu shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-2 z-50"
          role="dialog"
          aria-label="Appearance"
        >
          <div className="px-0.5 pt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Mode</div>
          <div className="grid grid-cols-2 gap-1">
            <ModeButton active={!dark} onClick={() => setDark(false)} icon="sun" label="Light" />
            <ModeButton active={dark} onClick={() => setDark(true)} icon="moon" label="Dark" />
          </div>
          {setGlass && (
            <Fragment>
              <div className="px-0.5 pt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Surface</div>
              <div className="grid grid-cols-2 gap-1">
                <ModeButton active={!glass} onClick={() => setGlass(false)} icon="stop" label="Solid" />
                <ModeButton active={glass} onClick={() => setGlass(true)} icon="layers" label="Glass" />
              </div>
            </Fragment>
          )}
          <div className="px-0.5 pt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Color</div>
          <div className="flex gap-2.5 p-0.5">
            {presets.map((preset) => {
              const active = preset.id === accent;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setAccent(preset.id)}
                  title={preset.label}
                  aria-label={preset.label}
                  aria-pressed={active}
                  className={`w-[26px] h-[26px] p-0 rounded-full border-2 border-white dark:border-gray-800 ${
                    active
                      ? 'shadow-[0_0_0_2px_#18181b] dark:shadow-[0_0_0_2px_#ffffff]'
                      : 'shadow-[0_0_0_1px_rgb(228_228_231/0.8)] dark:shadow-[0_0_0_1px_rgb(63_63_70/0.7)]'
                  }`}
                  style={{ backgroundColor: swatchOf(preset) }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppearanceMenu;
