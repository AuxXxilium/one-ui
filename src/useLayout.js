import { useState, useEffect } from 'preact/hooks';
import { storeValue } from './theme';

// Classic or desktop, remembered: the sidebar with one page at a time, or
// every page in a window of its own on a desktop.
//
//   const layout = useLayout();
//   <AppShell layout={layout} renderPage={(id) => <Page id={id} />} …>
//
// Returns { current, set, available }. The desktop needs a wide window -
// 1024 px by default - and `available` says whether this one is; narrower,
// AppShell shows the classic layout whatever was picked, and the Appearance
// panel says why the desktop is greyed out.
const read = (key) => {
  try {
    return localStorage.getItem(key) === 'desktop' ? 'desktop' : 'classic';
  } catch (e) {
    return 'classic';
  }
};

export function useLayout({ key = 'uiLayout', minWidth = 1024 } = {}) {
  const query = `(min-width: ${minWidth}px)`;
  const fits = () => typeof window === 'undefined' || !window.matchMedia || window.matchMedia(query).matches;
  const [current, setCurrent] = useState(() => read(key));
  const [available, setAvailable] = useState(fits);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const on = () => setAvailable(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener('change', on); else mq.addListener(on);
    return () => (mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on));
  }, [query]);

  const set = (next) => {
    const v = next === 'desktop' ? 'desktop' : 'classic';
    setCurrent(v);
    storeValue(key, v);
  };

  return { current, set, available };
}

export default useLayout;
