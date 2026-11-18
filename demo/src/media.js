// Sample pictures and music for the demo's lightbox and player, made here
// rather than downloaded: the pictures are drawn as SVG, the music is a few
// seconds of a chord written out as a WAV. None of it is real.
import { int, pickSome } from './random';

const SCENES = ['Harbor at dawn', 'Granite ridge', 'Lumen fields', 'Fjord evening', 'Cascade falls', 'Juniper hill'];
const SKIES = [
  ['#fde68a', '#f97316', '#7c2d12'], ['#bae6fd', '#3b82f6', '#1e3a8a'], ['#d9f99d', '#22c55e', '#14532d'],
  ['#fbcfe8', '#a855f7', '#312e81'], ['#a5f3fc', '#0ea5e9', '#0c4a6e'], ['#fed7aa', '#ef4444', '#450a0a'],
];

// A landscape: a sky in three tones, a sun and two rows of hills.
const picture = (sky, seed) => {
  const [a, b, c] = sky;
  const sun = 300 + (seed % 5) * 120;
  const hill = (y, amp, f) => {
    let d = `M0 ${y}`;
    for (let x = 0; x <= 1200; x += 60) d += ` L${x} ${y - Math.round(Math.sin((x + seed * 97) / f) * amp)}`;
    return `${d} L1200 800 L0 800 Z`;
  };
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'>
<defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='0.6' stop-color='${b}'/><stop offset='1' stop-color='${c}'/></linearGradient></defs>
<rect width='1200' height='800' fill='url(#s)'/>
<circle cx='${sun}' cy='300' r='90' fill='#fff' opacity='0.85'/>
<path d='${hill(560, 50, 140)}' fill='${c}' opacity='0.55'/>
<path d='${hill(650, 40, 90)}' fill='${c}'/>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// A chord that fades out, as 16-bit mono WAV at 22 kHz.
const tone = (freqs, seconds) => {
  const rate = 22050;
  const n = Math.round(rate * seconds);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i += 1) {
    const t = i / rate;
    const env = Math.min(1, t * 20) * Math.exp(-t * 0.8);
    const s = freqs.reduce((sum, f) => sum + Math.sin(2 * Math.PI * f * t), 0) / freqs.length;
    v.setInt16(44 + i * 2, Math.round(s * env * 0.4 * 32767), true);
  }
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
};

const SONGS = [
  ['Morning standup.wav', [261.6, 329.6, 392.0]],
  ['Release party.wav', [293.7, 370.0, 440.0]],
  ['Quiet hours.wav', [220.0, 261.6, 329.6]],
];

// The folder's contents: five pictures and three pieces of music. The music
// is written once, the first time a page shows the folder.
let songs = null;
export const mediaFolder = () => {
  const pics = pickSome(SCENES.map((name, i) => [name, i]), 5).map(([name, i]) => ({
    name: `${name}.svg`,
    kind: 'image',
    url: picture(SKIES[i], int(1, 40)),
  }));
  if (!songs) songs = SONGS.map(([name, freqs]) => ({ name, kind: 'audio', url: tone(freqs, 6) }));
  return [...pics, ...songs];
};
