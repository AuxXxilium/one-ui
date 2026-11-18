import { h } from 'preact';
import { useState, useRef } from 'preact/hooks';
import {
  wallpaperOf, pictureToWallpaper, readStoredWallpaper, readStoredPicture, storePicture, DEFAULT_WALLPAPER,
} from './wallpapers';
import { storeValue } from './theme';
import { toast } from './toast';

// The wallpaper for a whole app, remembered: the one AppShell draws behind
// the classic layout and the desktop, and the choices the Appearance panel
// offers - every preset as a small picture of itself, the viewer's own
// picture once there is one, and a button to choose one.
//
//   const wallpaper = useWallpaper();
//   <AppShell theme={theme} wallpaper={wallpaper} …>
//
// Returns { id, current, set, custom, choose, drop, input }:
//   current   the wallpaper to draw, { id, label, dark, className?, style? }
//   set(id)   a preset's id, or 'custom' for the viewer's picture
//   custom    the viewer's picture, { url, dark }, or null
//   choose()  opens the file dialog; the picture chosen becomes the wallpaper
//   drop()    forgets the viewer's picture
//   input     a hidden file input, to render once (AppShell does)
//
// Per browser, as the other appearance choices are. The keys are options for
// an app that keeps one wallpaper per signed-in user: key: `wallpaper:${user}`.
export function useWallpaper({
  key = 'wallpaper', pictureKey = 'wallpaperPicture', label = 'Your picture',
} = {}) {
  const [id, setId] = useState(() => readStoredWallpaper(key));
  const [custom, setCustom] = useState(() => readStoredPicture(pictureKey));
  const ref = useRef(null);

  const set = (next) => {
    setId(next);
    storeValue(key, next);
  };

  const use = async (file) => {
    try {
      const pic = await pictureToWallpaper(file);
      setCustom(pic);
      set('custom');
      if (!storePicture(pictureKey, pic)) {
        toast('This browser would not keep the picture, so it is the wallpaper until the page is reloaded.', 'info');
      }
    } catch (e) {
      toast((e && e.message) || 'The picture could not be used.', 'info');
    }
  };

  const shown = id === 'custom' && !custom ? DEFAULT_WALLPAPER : id;

  return {
    id: shown,
    current: wallpaperOf(shown, custom, label),
    set,
    custom,
    customLabel: label,
    choose: () => { if (ref.current) ref.current.click(); },
    drop: () => {
      setCustom(null);
      storePicture(pictureKey, null);
      if (id === 'custom') set(DEFAULT_WALLPAPER);
    },
    input: (
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.currentTarget.files && e.currentTarget.files[0];
          e.currentTarget.value = '';
          if (f) use(f);
        }}
      />
    ),
  };
}

export default useWallpaper;
