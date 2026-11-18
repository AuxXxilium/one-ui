import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { ACCENT_PRESETS, swatchOf } from '../theme';
import { wallpapers } from '../wallpapers';
import { Icon } from '../icons';

const ModeButton = ({ active, onClick, icon, label, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    disabled={disabled}
    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      active
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
        : 'bg-black/5 text-gray-900 dark:bg-white/10 dark:text-white hover:bg-black/10 dark:hover:bg-white/15'
    }`}
  >
    <Icon icon={icon} size={16} />{label}
  </button>
);

const Heading = ({ children }) => (
  <div className="px-0.5 pt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">{children}</div>
);

// One wallpaper: a small picture of it with its name beneath, so the choice
// is made by looking. The ring marks the one in use.
const WallpaperTile = ({ label, active, onClick, className = '', style }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={`Wallpaper: ${label}`}
    aria-pressed={active}
    className="flex flex-col gap-1 text-left min-w-0"
  >
    <span
      className={`aspect-[16/10] w-full rounded-lg bg-cover bg-center ${className} ${
        active
          ? 'ring-2 ring-blue-600 dark:ring-blue-400 ring-offset-1 ring-offset-white dark:ring-offset-zinc-800'
          : 'ring-1 ring-black/10 dark:ring-white/15 hover:ring-black/25 dark:hover:ring-white/30'
      }`}
      style={style}
    />
    <span className={`text-[11px] leading-tight truncate ${active ? 'font-semibold text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>{label}</span>
  </button>
);

// The choices themselves: Mode as two buttons, Surface (solid or glass) only
// when setGlass is passed, Layout with a `layout` (useLayout), Color as a row
// of dots with the one in use ringed, and Wallpaper with a `wallpaper`
// (useWallpaper). The appearance menu shows them, and so does AppShell's
// account menu. `onDone` closes whatever holds them when a choice hands over
// to something else - choosing a picture opens the file dialog.
export const AppearancePanel = ({
  dark, setDark, accent, setAccent, glass, setGlass, presets = ACCENT_PRESETS, layout, wallpaper, onDone,
}) => (
  <Fragment>
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
    {layout && (
      <Fragment>
        <Heading>Layout</Heading>
        <div className="grid grid-cols-2 gap-1">
          <ModeButton active={layout.current !== 'desktop'} onClick={() => layout.set('classic')} icon="layoutSidebar" label="Classic" />
          <ModeButton active={layout.current === 'desktop'} disabled={!layout.available} onClick={() => layout.set('desktop')} icon="layoutDesktop" label="Desktop" />
        </div>
        {!layout.available && (
          <div className="px-0.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400 max-w-[200px]">The desktop needs a wider window.</div>
        )}
      </Fragment>
    )}
    <div className="px-0.5 pt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Color</div>
    <div className="flex flex-wrap gap-2.5 p-0.5">
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
    {wallpaper && (
      <Fragment>
        <Heading>Wallpaper</Heading>
        <div className="grid grid-cols-3 gap-x-1.5 gap-y-2 p-0.5">
          {wallpapers().map((wp) => (
            <WallpaperTile
              key={wp.id}
              label={wp.label}
              active={wallpaper.id === wp.id}
              onClick={() => wallpaper.set(wp.id)}
              className={wp.className}
              style={wp.style}
            />
          ))}
          {wallpaper.custom && (
            <WallpaperTile
              label={wallpaper.customLabel || 'Your picture'}
              active={wallpaper.id === 'custom'}
              onClick={() => wallpaper.set('custom')}
              style={{ backgroundImage: `url("${wallpaper.custom.url}")` }}
            />
          )}
          <button
            type="button"
            onClick={() => { if (onDone) onDone(); wallpaper.choose(); }}
            title="Choose a picture from this computer"
            aria-label="Choose a picture for the wallpaper"
            className="group flex flex-col gap-1 text-left"
          >
            <span className="aspect-[16/10] w-full rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 group-hover:bg-black/10 dark:group-hover:bg-white/15 transition-colors">
              <Icon icon="upload" size={16} />
            </span>
            <span className="text-[11px] leading-tight truncate text-gray-600 dark:text-gray-300">Your own…</span>
          </button>
        </div>
        {wallpaper.custom && (
          <button
            type="button"
            onClick={wallpaper.drop}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
          >
            <Icon icon="trash" size={14} />Remove your picture
          </button>
        )}
      </Fragment>
    )}
  </Fragment>
);

// Light/dark and the accent behind one sun/moon button. Takes what useTheme
// returns: <AppearanceMenu {...theme} />.
//
// Surface - solid or glass boxes - shows only when setGlass is passed, so an
// app that does not offer glass does not get the row.
const AppearanceMenu = (theme) => {
  const { dark } = theme;
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
          className={`absolute right-0 mt-2 min-w-[200px] ${theme.wallpaper ? 'w-64' : ''} max-w-[calc(100vw-2rem)] grid gap-1.5 rounded-xl panel panel-menu shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-2 z-50`}
          role="dialog"
          aria-label="Appearance"
        >
          <AppearancePanel {...theme} onDone={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default AppearanceMenu;
