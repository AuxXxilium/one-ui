// Wallpapers: the ground behind the whole app, in the classic layout and on
// the desktop. No Preact in this file.
//
// Two kinds. Gradients of the accent or of fixed colours, and pictures drawn
// here as SVG rather than shipped as image files, so they are sharp on any
// screen and cost a few KB, not a few MB. Each picture is drawn once, at
// load, on a 1600 x 1000 canvas that covers the screen (slice: cropped,
// never stretched). The scatter (stars, sparks) and the ridges come from a
// fixed seed, so every browser draws the same picture and a reload does not
// move a star.
//
// A wallpaper is { id, label, dark, className?, style? }: className or style
// is what to put on the element that shows it, and `dark` says that text
// laid straight on it (a desktop icon's name) should be white.

const W = 1600;
const H = 1000;

const rng = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const r1 = (v) => Math.round(v * 10) / 10;

// A smooth line through points, as quadratic curves between their midpoints.
const smooth = (pts) => {
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${r1(pts[i][0])} ${r1(pts[i][1])} ${r1(mx)} ${r1(my)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${r1(last[0])} ${r1(last[1])}`;
};

// A filled band from a line down to the bottom edge.
const toBottom = (line) => `${line} L${W + 20} ${H + 20} L-20 ${H + 20} Z`;

// A mountain ridge by midpoint displacement: a line that keeps splitting
// its segments and nudging each middle up or down, less at every level -
// how a skyline looks rough at every scale. Its highest point reaches about
// `amp` above `y`.
const ridge = (seed, y, amp, rough = 0.55, depth = 7) => {
  const r = rng(seed);
  const n = 1 << depth;
  const v = new Array(n + 1).fill(0);
  v[0] = r(); v[n] = r();
  let step = n; let range = 1;
  while (step > 1) {
    const half = step / 2;
    for (let i = half; i < n; i += step) v[i] = (v[i - half] + v[i + half]) / 2 + (r() - 0.5) * range;
    range *= rough; step = half;
  }
  const lo = Math.min(...v); const hi = Math.max(...v);
  const pts = v.map((k, i) => [(i / n) * (W + 40) - 20, y - ((k - lo) / (hi - lo || 1)) * amp]);
  return toBottom(`M${pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join(' L')}`);
};

// A rolling line: a sum of two sines, for waves and dunes.
const roll = (y, amp, len, phase, amp2 = 0, len2 = 1, steps = 40) => {
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = (i / steps) * (W + 40) - 20;
    pts.push([x, y + amp * Math.sin((x / len) * Math.PI * 2 + phase) + amp2 * Math.sin((x / len2) * Math.PI * 2 + phase * 1.7)]);
  }
  return smooth(pts);
};

const stars = (seed, n, maxY, color = '#fff') => {
  const r = rng(seed);
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const big = r() > 0.92;
    out += `<circle cx="${r1(r() * W)}" cy="${r1(r() * maxY)}" r="${big ? 1.6 : r1(0.5 + r() * 0.7)}" fill="${color}" opacity="${r1(0.3 + r() * 0.6)}"/>`;
  }
  return out;
};

const svg = (body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}</svg>`;
const lin = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
const rad = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
// In canvas units over the whole picture: a box around the shape clipped
// the blur into visible rectangles.
const blur = (id, s) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="-200" y="-200" width="${W + 400}" height="${H + 400}"><feGaussianBlur stdDeviation="${s}"/></filter>`;

// Northern lights over a dark ridge: curtains of thin rays rising from an
// arc and fading upward, a faint far one above the near one.
const northernLights = () => {
  const r = rng(5);
  const arc = (x, y, amp, len, phase) => y + amp * Math.sin((x / len) * Math.PI * 2 + phase) + amp * 0.4 * Math.sin((x / (len * 0.43)) * Math.PI * 2 + phase * 1.7);
  const curtain = (y, amp, len, phase, grad, height, density) => {
    let rays = '';
    for (let x = -20; x < W + 20; x += density) {
      const base = arc(x, y, amp, len, phase);
      // Folds: the rays' height swells and shrinks along the arc.
      const h = height * (0.45 + 0.35 * (0.5 + 0.5 * Math.sin((x / 520) * Math.PI * 2 + phase * 3)) + r() * 0.2);
      rays += `<rect x="${r1(x)}" y="${r1(base - h)}" width="${r1(density * 0.9)}" height="${r1(h)}" fill="url(#${grad})" opacity="${r1(0.35 + r() * 0.65)}"/>`;
    }
    // A soft copy under the sharp rays: the light's haze, kept within the
    // curtain - a broad glow along the arc read as a hill beneath it.
    return `<g filter="url(#wide)" opacity="0.6">${rays}</g><g filter="url(#fine)">${rays}</g>`;
  };
  return svg(
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>${stars(7, 190, 700)}`
    + `<g opacity="0.45">${curtain(300, 50, 1300, 2.4, 'gv', 220, 9)}</g>`
    + curtain(560, 110, 1700, 0.5, 'gg', 380, 6)
    + `<rect width="${W}" height="${H}" fill="url(#glow)"/>`
    + `<path d="${ridge(11, 860, 150, 0.5)}" fill="#060c18"/>`
    + `<path d="${ridge(12, 940, 90, 0.6)}" fill="#010308"/>`,
    lin('sky', [[0, '#020617'], [0.5, '#030a17'], [1, '#04101a']])
    + lin('gg', [[0, '#a78bfa', 0], [0.55, '#2dd4bf', 0.55], [0.9, '#4ade80', 0.95], [1, '#bbf7d0', 0.9]])
    + lin('gv', [[0, '#c084fc', 0], [0.5, '#818cf8', 0.45], [0.85, '#22d3ee', 0.8], [1, '#5eead4', 0.85]])
    + rad('glow', [[0, '#34d399', 0.07], [1, '#34d399', 0]], 0.5, 0.3, 0.5)
    + blur('wide', 14) + blur('fine', 2),
  );
};

// Mountains at dusk: a low sun behind ranges that grow darker and nearer.
const mountains = () => svg(
  `<rect width="${W}" height="${H}" fill="url(#sky)"/>`
  + `<circle cx="1060" cy="520" r="260" fill="url(#sunGlow)"/><circle cx="1060" cy="520" r="70" fill="#fde68a"/>`
  + `<path d="${ridge(21, 640, 230, 0.52)}" fill="#a05a8c"/>`
  + `<path d="${ridge(22, 720, 210, 0.55)}" fill="#76406f"/>`
  + `<path d="${ridge(23, 810, 190, 0.55)}" fill="#4d2a5a"/>`
  + `<path d="${ridge(24, 900, 160, 0.6)}" fill="#2a1838"/>`
  + `<path d="${ridge(25, 980, 110, 0.6)}" fill="#160c20"/>`,
  lin('sky', [[0, '#1e1b4b'], [0.4, '#6d28d9'], [0.68, '#f472b6'], [0.85, '#fb923c']])
  + rad('sunGlow', [[0, '#fde68a', 0.75], [1, '#fb923c', 0]]),
);

// Waves: layered swell in deep blues and teals.
const waves = () => {
  const band = (y, amp, len, phase, fill, op = 1) => `<path d="${toBottom(roll(y, amp, len, phase, amp * 0.35, len * 0.37))}" fill="${fill}" opacity="${op}"/>`;
  return svg(
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>`
    + band(380, 40, 1300, 0.2, '#38bdf8', 0.45)
    + band(470, 46, 1000, 1.4, '#0ea5e9', 0.7)
    + band(570, 52, 1200, 2.6, '#0284c7')
    + band(670, 48, 900, 3.4, '#0369a1')
    + band(770, 44, 1100, 4.6, '#075985')
    + band(870, 40, 800, 5.5, '#0c4a6e'),
    lin('sky', [[0, '#0f172a'], [0.6, '#1e3a8a'], [1, '#155e75']]),
  );
};

// Dunes: warm sand under a pale sky - the one light picture of the set.
const dunes = () => {
  const band = (y, amp, len, phase, fill) => `<path d="${toBottom(roll(y, amp, len, phase, amp * 0.25, len * 0.5, 30))}" fill="${fill}"/>`;
  return svg(
    `<rect width="${W}" height="${H}" fill="url(#sky)"/><circle cx="360" cy="260" r="200" fill="url(#sun)"/>`
    + band(560, 60, 1700, 0.6, '#fcd9a6')
    + band(650, 70, 1400, 2.2, '#f8bf7c')
    + band(750, 60, 1500, 3.9, '#ee9b55')
    + band(850, 55, 1200, 5.0, '#d9773a')
    + band(940, 40, 1000, 1.0, '#b45a2a'),
    lin('sky', [[0, '#fff7ed'], [0.6, '#fde7c8'], [1, '#fbcf98']])
    + rad('sun', [[0, '#ffffff', 0.9], [0.4, '#fff1d6', 0.6], [1, '#fff1d6', 0]]),
  );
};

// Embers: sparks rising from a fire's glow at the bottom of
// the dark: a few large out-of-focus ones, many small sharp ones, thinning
// out and cooling as they climb.
const embers = () => {
  const r = rng(31);
  const spark = (big) => {
    const t = Math.pow(r(), 1.5); // 0 bottom .. 1 top, most near the fire
    const y = H - t * H * 0.98;
    const heat = r() * (1 - t * 0.6);
    const c = heat > 0.55 ? '#fde68a' : heat > 0.3 ? '#fb923c' : '#f43f5e';
    const rad0 = big ? 8 + r() * 16 : 1 + r() * 2.6;
    return `<circle cx="${r1(r() * W)}" cy="${r1(y)}" r="${r1(rad0)}" fill="${c}" opacity="${r1((big ? 0.18 : 0.35) + (1 - t) * 0.55)}"/>`;
  };
  let bokeh = ''; let sharp = '';
  for (let i = 0; i < 26; i += 1) bokeh += spark(true);
  for (let i = 0; i < 260; i += 1) sharp += spark(false);
  return svg(
    `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#heat)"/>`
    + `<rect width="${W}" height="${H}" fill="url(#core)"/>`
    + `<g filter="url(#bokeh)">${bokeh}</g><g filter="url(#halo)">${sharp}</g>${sharp}`,
    lin('bg', [[0, '#070505'], [0.55, '#1a0905'], [1, '#410f03']])
    + rad('heat', [[0, '#f97316', 0.75], [0.45, '#dc2626', 0.3], [1, '#7f1d1d', 0]], 0.5, 1.1, 0.85)
    + rad('core', [[0, '#fde68a', 0.55], [0.4, '#f59e0b', 0.15], [1, '#f59e0b', 0]], 0.5, 1.08, 0.35)
    + blur('bokeh', 9) + blur('halo', 4),
  );
};

const asUrl = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const pic = (make) => ({ backgroundImage: asUrl(make()), backgroundSize: 'cover', backgroundPosition: 'center' });

// Drawn on first use, not at import, so an app that never shows a wallpaper
// never draws one.
let drawn = null;
const DRAWN = () => {
  if (!drawn) {
    drawn = {
      aurora: pic(northernLights),
      mountains: pic(mountains),
      waves: pic(waves),
      dunes: pic(dunes),
      embers: pic(embers),
    };
  }
  return drawn;
};

// `wash` is One UI's own ground: the soft accent washes, light or dark with
// the mode. The rest are pictures in their own right, the same in light and
// dark. The accent one follows the colour picker.
const PRESETS = [
  { id: 'wash', label: 'Soft wash', className: 'app-wash' },
  {
    id: 'accent', label: 'Accent', dark: true,
    style: { backgroundImage: 'radial-gradient(70rem 50rem at 10% 0%, rgb(var(--accent-400)), transparent 60%), radial-gradient(60rem 50rem at 100% 100%, rgb(var(--accent-700)), transparent 60%), linear-gradient(135deg, rgb(var(--accent-600)), rgb(var(--accent-900)))' },
  },
  { id: 'aurora', label: 'Northern lights', dark: true, drawn: 'aurora' },
  { id: 'mountains', label: 'Mountains', dark: true, drawn: 'mountains' },
  { id: 'waves', label: 'Waves', dark: true, drawn: 'waves' },
  { id: 'dunes', label: 'Dunes', drawn: 'dunes' },
  { id: 'embers', label: 'Embers', dark: true, drawn: 'embers' },
  {
    id: 'dusk', label: 'Dusk', dark: true,
    style: { backgroundImage: 'radial-gradient(60rem 40rem at 80% 0%, #fb923c99, transparent 60%), radial-gradient(60rem 45rem at 0% 100%, #db277788, transparent 60%), linear-gradient(160deg, #312e81, #4c1d95 55%, #831843)' },
  },
  {
    id: 'mist', label: 'Mist',
    style: { backgroundImage: 'radial-gradient(60rem 40rem at 0% 0%, #bae6fd, transparent 60%), radial-gradient(55rem 40rem at 100% 100%, #e9d5ff, transparent 60%), linear-gradient(160deg, #f8fafc, #e2e8f0)' },
  },
  {
    id: 'graphite', label: 'Graphite', dark: true,
    style: { backgroundImage: 'radial-gradient(60rem 40rem at 20% 0%, #3f3f46, transparent 60%), linear-gradient(160deg, #18181b, #09090b)' },
  },
];

const resolve = (w) => (w.drawn ? { id: w.id, label: w.label, dark: w.dark, style: DRAWN()[w.drawn] } : w);

// Every preset, ready to show: [{ id, label, dark, className?, style? }].
export const wallpapers = () => PRESETS.map(resolve);
export const WALLPAPER_IDS = PRESETS.map((w) => w.id);
export const DEFAULT_WALLPAPER = 'wash';

// The wallpaper to draw: a preset by id, or the viewer's own picture under
// 'custom' ({ url, dark }, see pictureToWallpaper). Anything unknown is the
// wash.
export const wallpaperOf = (id, custom, label = 'Your picture') => {
  if (id === 'custom' && custom) {
    return {
      id: 'custom',
      label,
      dark: custom.dark,
      style: { backgroundImage: `url("${custom.url}")`, backgroundSize: 'cover', backgroundPosition: 'center' },
    };
  }
  return resolve(PRESETS.find((w) => w.id === id) || PRESETS[0]);
};

// A picture file as a wallpaper: scaled down to at most 2560 x 1600 as a JPEG,
// a few hundred KB rather than whatever the camera wrote, and measured where
// a desktop's icons sit (the top-left quarter) to say whether their names go
// white on it. Resolves { url, dark }; rejects with a readable message.
export const pictureToWallpaper = (file) => new Promise((done, fail) => {
  if (!file || !/^image\//.test(file.type)) { fail(new Error('That is not a picture.')); return; }
  const src = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    try {
      const scale = Math.min(1, 2560 / img.naturalWidth, 1600 / img.naturalHeight);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const px = ctx.getImageData(0, 0, Math.max(1, Math.round(w / 4)), Math.max(1, Math.round(h / 2))).data;
      let sum = 0;
      let n = 0;
      for (let i = 0; i < px.length; i += 4 * 16) {
        sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
        n += 1;
      }
      done({ url: canvas.toDataURL('image/jpeg', 0.85), dark: n > 0 && sum / n < 140 });
    } catch (e) {
      fail(e);
    } finally {
      URL.revokeObjectURL(src);
    }
  };
  img.onerror = () => { URL.revokeObjectURL(src); fail(new Error('The picture could not be read.')); };
  img.src = src;
});

// The stored choice and the stored picture. The picture is kept apart, as
// the one large value. Every read is guarded and checked for shape: storage
// throws in a private window, and a hand-edited entry gives the default
// rather than a blank page.
export const readStoredWallpaper = (key = 'wallpaper') => {
  try {
    const v = localStorage.getItem(key);
    return v === 'custom' || WALLPAPER_IDS.indexOf(v) !== -1 ? v : DEFAULT_WALLPAPER;
  } catch (e) {
    return DEFAULT_WALLPAPER;
  }
};

export const readStoredPicture = (key = 'wallpaperPicture') => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v.url === 'string' && v.url.startsWith('data:image/') ? { url: v.url, dark: !!v.dark } : null;
  } catch (e) {
    return null;
  }
};

// False when the browser would not keep it (storage full or blocked): the
// picture is then this visit's only.
export const storePicture = (key, pic) => {
  try {
    if (pic) localStorage.setItem(key, JSON.stringify(pic));
    else localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
};
