import { useState, useEffect } from 'preact/hooks';
import {
  applyAccent, applyDark, applyGlass, readStoredAccent, readStoredDark, readStoredGlass, storeValue, DEFAULT_ACCENT,
} from './theme';

// Light/dark, the accent and solid/glass boxes for a whole app, applied and
// remembered.
//
//   const theme = useTheme({ defaultAccent: 'amber' });
//   <AppearanceMenu {...theme} />
//
// The keys are options because an app may already store the choice under
// its own names, and moving them would forget what every user picked.
export function useTheme({
  accentKey = 'accentColor', darkKey = 'darkMode', glassKey = 'surfaceGlass',
  defaultAccent = DEFAULT_ACCENT, defaultGlass = false,
} = {}) {
  const [dark, setDark] = useState(() => readStoredDark(darkKey));
  const [accent, setAccent] = useState(() => readStoredAccent(accentKey, defaultAccent));
  const [glass, setGlass] = useState(() => {
    try {
      if (localStorage.getItem(glassKey) === null) return defaultGlass;
    } catch (e) {
      return defaultGlass;
    }
    return readStoredGlass(glassKey);
  });

  useEffect(() => {
    applyDark(dark);
    storeValue(darkKey, dark);
  }, [dark, darkKey]);

  useEffect(() => {
    applyAccent(accent, defaultAccent);
    storeValue(accentKey, accent);
  }, [accent, accentKey, defaultAccent]);

  useEffect(() => {
    applyGlass(glass);
    storeValue(glassKey, glass);
  }, [glass, glassKey]);

  return { dark, setDark, accent, setAccent, glass, setGlass };
}

export default useTheme;
