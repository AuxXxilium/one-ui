// Takes the screenshots in docs/renders from the demo in this folder, with headless
// Chrome or Edge.
//   npm run render      (builds first)
//
// The browser is found automatically; set CHROME_PATH to override.
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];
const executablePath = candidates.find((p) => p && existsSync(p));
if (!executablePath) {
  console.error('No Chrome or Edge found. Set CHROME_PATH to a Chromium-based browser.');
  process.exit(1);
}

const OUT = 'docs/renders';
mkdirSync(OUT, { recursive: true });
const url = (file, query) => `${pathToFileURL(resolve('demo', file)).href}?seed=42&${query}`;

// The bottom-right corner, where the host widget sits, with the cards behind it.
const CORNER = { x: 880, y: 400, width: 560, height: 500 };

// name, file, query, options. widget=0 leaves the host widget out of the
// pictures that are not about it: its button would sit over the content in the
// corner of every page.
const SHOTS = [
  ['overview-light', 'index.html', 'page=overview&dark=0&accent=blue&glass=0&widget=0'],
  ['overview-dark', 'index.html', 'page=overview&dark=1&accent=blue&glass=0&widget=0'],
  ['overview-glass-light', 'index.html', 'page=overview&dark=0&accent=blue&glass=1&widget=0'],
  ['overview-glass-dark', 'index.html', 'page=overview&dark=1&accent=amber&glass=1&widget=0'],
  ['components-amber', 'index.html', 'page=components&dark=0&accent=amber&glass=0&widget=0'],
  ['forms-dark-green', 'index.html', 'page=forms&dark=1&accent=green&glass=0&widget=0'],
  ['tables-graphite', 'index.html', 'page=tables&dark=0&accent=graphite&glass=0&widget=0'],
  ['dialog-confirm', 'index.html', 'page=dialogs&dark=0&accent=red&glass=0&modal=confirm&widget=0', { tall: false }],
  ['dialogs-dark', 'index.html', 'page=dialogs&dark=1&accent=blue&glass=1&widget=0'],
  ['appearance-menu', 'index.html', 'page=about&dark=0&accent=blue&glass=1&widget=0', { tall: false, menu: true }],
  ['menus-glass-light', 'index.html', 'page=menus&dark=0&accent=green&glass=1&menu=1&widget=0', { tall: false }],
  ['menus-glass-dark', 'index.html', 'page=menus&dark=1&accent=amber&glass=1&menu=1&widget=0', { tall: false }],
  ['context-menu-glass-light', 'index.html', 'page=menus&dark=0&accent=red&glass=1&ctx=1&widget=0', { tall: false }],
  ['context-menu-dark', 'index.html', 'page=menus&dark=1&accent=graphite&glass=0&ctx=1&widget=0', { tall: false }],
  ['widget-solid-light', 'index.html', 'page=overview&dark=0&accent=blue&glass=0&widget=1', { tall: false, clip: CORNER }],
  ['widget-solid-dark', 'index.html', 'page=overview&dark=1&accent=blue&glass=0&widget=1', { tall: false, clip: CORNER }],
  ['widget-glass-light', 'index.html', 'page=overview&dark=0&accent=blue&glass=1&widget=1', { tall: false, clip: CORNER }],
  ['widget-glass-dark', 'index.html', 'page=overview&dark=1&accent=amber&glass=1&widget=1', { tall: false, clip: CORNER }],
  ['icons', 'index.html', 'page=icons&dark=0&accent=blue&glass=0&widget=0'],
  ['about-dark', 'index.html', 'page=about&dark=1&accent=red&glass=0&widget=0'],
  ['phone', 'index.html', 'page=overview&dark=0&accent=blue&glass=0&widget=0', { width: 390, height: 844, scale: 2, tall: true }],
  ['plain-light', 'plain.html', 'x=1', { plain: { dark: false, glass: false, accent: 'blue' } }],
  ['plain-dark-glass', 'plain.html', 'x=1', { plain: { dark: true, glass: true, accent: 'amber' } }],
];

const browser = await puppeteer.launch({ executablePath, headless: 'new' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

for (const [name, file, query, opt = {}] of SHOTS) {
  const width = opt.width || 1440;
  const height = opt.height || 900;
  await page.setViewport({ width, height, deviceScaleFactor: opt.scale || 1 });

  if (opt.plain) {
    // The plain page reads its look from storage, as it would in a real app.
    await page.goto(url(file, query));
    await page.evaluate((p) => { OneUI.setDark(p.dark); OneUI.setGlass(p.glass); OneUI.setAccent(p.accent); }, opt.plain);
  } else {
    await page.goto(url(file, query));
  }
  await new Promise((r) => setTimeout(r, 400));

  if (opt.menu) {
    await page.click('button[aria-label="Appearance"]');
    await new Promise((r) => setTimeout(r, 200));
  }

  // The app scrolls inside <main>, so a full-page shot would stop at the
  // window, and the plain page's fixed background would stop with it. Grow
  // the window to fit the page instead.
  if (opt.tall !== false) {
    const need = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? main.scrollHeight + main.getBoundingClientRect().top : document.body.scrollHeight;
    });
    await page.setViewport({ width, height: Math.min(Math.max(height, Math.ceil(need)), 2600), deviceScaleFactor: opt.scale || 1 });
    await new Promise((r) => setTimeout(r, 200));
  }

  await page.screenshot({ path: `${OUT}/${name}.png`, ...(opt.clip ? { clip: opt.clip } : {}) });
  console.log(`${OUT}/${name}.png`);
}

await browser.close();
if (errors.length) {
  console.error('Errors in the page:\n' + errors.join('\n'));
  process.exit(1);
}
