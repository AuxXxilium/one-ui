import { h, Fragment } from 'preact';

// The icons. Drawn on one 24x24 grid with a shared 2px round stroke so they
// sit together at 16px, rather than pulled from an icon font or emoji: an
// emoji brings its own colours and looks different on every platform, a line
// icon takes the colour of whatever it sits in.
//
// Every glyph is reachable by name - <Icon icon="refresh" /> - or directly as
// ICONS.refresh. The page glyphs (main, settings, disks...) are in the same
// list, so a sidebar entry and a button draw from one set.
export const ICONS = {
  // Interface.
  close: <path d="M18 6L6 18M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  // Three dots, for a "more actions" button. Drawn rather than typed: three
  // full stops sit on the text baseline, low in a square button.
  more: <Fragment><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></Fragment>,
  // A sparkline, for live statistics: uneven runs and an uneven baseline,
  // ending on a rise. Two even peaks read as a pair of carets at 18px.
  trend: <path d="M3 16l4-6 3 3 4-7 4 3 3-5" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  sun: <Fragment><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Fragment>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  copy: <Fragment><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></Fragment>,
  edit: <Fragment><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Fragment>,

  // Actions and status.
  refresh: <Fragment><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.5-4" /><path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7.5 4" /><path d="M20 3v5h-5" /><path d="M4 21v-5h5" /></Fragment>,
  spinner: <path d="M12 3a9 9 0 1 0 9 9" />,
  start: <path d="M6 4l14 8-14 8V4z" />,
  stop: <rect x="5" y="5" width="14" height="14" rx="2" />,
  bell: <Fragment><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></Fragment>,
  chip: <Fragment><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6v6H9z" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" /></Fragment>,
  health: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  key: <Fragment><circle cx="7.5" cy="15.5" r="4.5" /><path d="M10.7 12.3L21 2M17 6l3 3M15 8l2 2" /></Fragment>,
  upload: <Fragment><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></Fragment>,
  rollback: <Fragment><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></Fragment>,
  history: <Fragment><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></Fragment>,
  warning: <Fragment><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></Fragment>,
  info: <Fragment><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></Fragment>,
  success: <Fragment><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></Fragment>,
  error: <Fragment><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></Fragment>,
  check: <path d="M5 12l5 5L20 7" />,
  gear: <Fragment><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Fragment>,
  search: <Fragment><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Fragment>,
  download: <Fragment><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></Fragment>,
  trash: <Fragment><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" /><path d="M10 11v6M14 11v6" /></Fragment>,
  file: <Fragment><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></Fragment>,
  external: <Fragment><path d="M15 3h6v6" /><path d="M10 14L21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Fragment>,
  power: <Fragment><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.8 0" /></Fragment>,
  link: <Fragment><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></Fragment>,
  arrowDown: <Fragment><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></Fragment>,
  arrowUp: <Fragment><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></Fragment>,
  upgrade: <Fragment><circle cx="12" cy="12" r="9" /><path d="M12 16V8" /><path d="M8 12l4-4 4 4" /></Fragment>,
  zap: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  wrench: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8z" />,
  hammer: <Fragment><path d="M15 12l-8.4 8.4a2.1 2.1 0 0 1-3-3L12 9" /><path d="M18 15l4-4" /><path d="M21.5 11.5l-1.9-1.9a2 2 0 0 1-.6-1.4V7l-2.3-2.3A6 6 0 0 0 12.5 3H9l.9.8A6.2 6.2 0 0 1 12 8.4V10l2 2h1.2a2 2 0 0 1 1.4.6l1.9 1.9" /></Fragment>,
  cores: <Fragment><rect x="6" y="6" width="12" height="12" rx="1.5" /><path d="M10 9v6M14 9v6" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></Fragment>,
  gauge: <Fragment><path d="M3.3 19a10 10 0 1 1 17.4 0" /><path d="M12 14l4-4" /><path d="M12 14h.01" /></Fragment>,
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  rocket: <Fragment><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z" /><path d="M12 15l-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z" /><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0" /><path d="M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5" /></Fragment>,
  fader: <Fragment><path d="M5 21v-7M5 10V3M12 21v-9M12 8V3M19 21v-5M19 12V3" /><path d="M2 14h6M9 8h6M16 16h6" /></Fragment>,
  compass: <Fragment><circle cx="12" cy="12" r="9" /><path d="M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z" /></Fragment>,

  // Things.
  server: <Fragment><rect x="3" y="4" width="18" height="7" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /><path d="M7 7.5h.01M7 16.5h.01" /></Fragment>,
  monitor: <Fragment><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></Fragment>,
  hardDrive: <Fragment><rect x="2" y="13" width="20" height="8" rx="2" /><path d="M5.5 13L8 4h8l2.5 9" /><path d="M6 17h.01M10 17h.01" /></Fragment>,
  ssd: <Fragment><path d="M3 8h18v8H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><rect x="6" y="10.5" width="4" height="3" rx=".5" /><rect x="12" y="10.5" width="4" height="3" rx=".5" /><path d="M19 10v4" /></Fragment>,
  controller: <Fragment><rect x="2" y="5" width="20" height="11" rx="1.5" /><path d="M6 16v3M10 16v3M14 16v3" /><rect x="6" y="8.5" width="5" height="4" rx=".5" /><path d="M14 9h4M14 12h4" /></Fragment>,
  memory: <Fragment><rect x="2" y="6" width="20" height="10" rx="1.5" /><path d="M6 10v2M10 10v2M14 10v2M18 10v2" /><path d="M6 16v3M10 16v3M14 16v3M18 16v3" /></Fragment>,
  usb: <Fragment><rect x="7" y="10" width="10" height="12" rx="2" /><path d="M9 10V3h6v7" /><path d="M11 6h.01M13 6h.01" /></Fragment>,
  thermometer: <path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z" />,
  ethernet: <Fragment><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 16v-4h1.5v-2h5v2H16v4z" /></Fragment>,
  plug: <Fragment><path d="M12 22v-5" /><path d="M9 8V2M15 8V2" /><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z" /></Fragment>,
  bulb: <Fragment><path d="M9 18h6M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" /></Fragment>,
  camera: <Fragment><path d="M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="4" /></Fragment>,
  video: <Fragment><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3z" /></Fragment>,
  os: <Fragment><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M6.5 6.5h.01M9.5 6.5h.01" /></Fragment>,
  terminal: <Fragment><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" /></Fragment>,
  prompt: <Fragment><path d="M4 17l6-5-6-5" /><path d="M12 19h8" /></Fragment>,
  package: <Fragment><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></Fragment>,
  layers: <Fragment><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /><path d="M3 17.5l9 5 9-5" /></Fragment>,
  database: <Fragment><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></Fragment>,
  list: <Fragment><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></Fragment>,
  swap: <Fragment><path d="M7 4L3 8l4 4" /><path d="M3 8h14" /><path d="M17 12l4 4-4 4" /><path d="M21 16H7" /></Fragment>,
  tag: <Fragment><path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z" /><path d="M7.5 7.5h.01" /></Fragment>,
  user: <Fragment><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Fragment>,
  timer: <Fragment><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M10 2h4" /></Fragment>,
  heart: <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />,

  // Pages: one per sidebar entry.
  main: <Fragment><path d="M3 11l9-8 9 8" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-6h4v6" /></Fragment>,
  settings: <Fragment><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" /><circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="18" r="2" /></Fragment>,
  addons: <Fragment><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Fragment>,
  update: <Fragment><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" /><path d="M12 16V9M9 12l3-3 3 3" /></Fragment>,
  storage: <Fragment><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 12h3l2-3 2 6 2-3h3" /></Fragment>,
  hibernation: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  notifications: <Fragment><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></Fragment>,
  backup: <Fragment><path d="M21 8v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8" /><rect x="2" y="3" width="20" height="5" rx="1" /><path d="M12 11v6M9 14l3 3 3-3" /></Fragment>,
  disks: <Fragment><rect x="3" y="4" width="18" height="7" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /><path d="M7 7.5h.01M7 16.5h.01" /></Fragment>,
  resources: <Fragment><path d="M3 3v18h18" /><path d="M7 15l4-5 3 3 5-7" /></Fragment>,
  network: <Fragment><rect x="9" y="2" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="16" y="16" width="6" height="6" rx="1" /><path d="M12 8v4M5 16v-2h14v2" /></Fragment>,
  gpu: <Fragment><rect x="2" y="5" width="20" height="12" rx="2" /><circle cx="9" cy="11" r="3" /><path d="M15 9h3M15 13h3" /><path d="M6 17v3M10 17v3" /></Fragment>,
  cpu: <Fragment><rect x="6" y="6" width="12" height="12" rx="1.5" /><rect x="9.5" y="9.5" width="5" height="5" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></Fragment>,
  fan: <Fragment><circle cx="12" cy="12" r="2" /><path d="M12 10c0-4 1-7 4-7 2 0 3 2 1 4l-3 3" /><path d="M14 12c4 0 7 1 7 4 0 2-2 3-4 1l-3-3" /><path d="M12 14c0 4-1 7-4 7-2 0-3-2-1-4l3-3" /><path d="M10 12c-4 0-7-1-7-4 0-2 2-3 4-1l3 3" /></Fragment>,
  services: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8z" />,
  permissions: <Fragment><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L20 3" /><path d="M16 7l3 3" /><path d="M14 9l2 2" /></Fragment>,
  film: <Fragment><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3z" /></Fragment>,
  benchmark: <Fragment><path d="M3 20h18" /><path d="M6 20v-6M11 20V8M16 20v-9M21 20V4" /></Fragment>,
  speedtest: <Fragment><path d="M3.3 19a10 10 0 1 1 17.4 0" /><path d="M12 14l4-4" /><path d="M12 14h.01" /></Fragment>,
  debug: <Fragment><rect x="8" y="6" width="8" height="14" rx="4" /><path d="M12 11v9" /><path d="M9 6L7.5 3.5M15 6l1.5-2.5" /><path d="M3 13h5M16 13h5M4 7l4 3M20 7l-4 3M4 19l4-3M20 19l-4-3" /></Fragment>,
  about: <Fragment><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></Fragment>,
  docs: <Fragment><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></Fragment>,
  globe: <Fragment><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Fragment>,
};

// One icon. `icon` is a name from ICONS or a glyph of its own. aria-hidden
// because every caller either has a visible label beside it or an aria-label
// of its own.
//
// SVG attributes are spelled as SVG spells them: Preact without compat sets
// them as written, so a camelCased strokeWidth would be ignored.
export const Icon = ({ icon, size = 16, className }) => (
  <svg
    viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"
    fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round"
    className={className}
  >
    {typeof icon === 'string' ? ICONS[icon] : icon}
  </svg>
);

// A glyph on its own small tile, the way a card names itself in its header.
// The glyph is a neutral dark grey so headers stay quiet whatever accent is
// picked, unless the caller passes a tone - red for failed, green for done -
// and spin is for a job still running.
export const IconTile = ({ icon, tone = 'text-gray-800 dark:text-gray-300', spin = false, className = '' }) => (
  <span className={`w-9 h-9 shrink-0 rounded-xl bg-white dark:bg-gray-700/70 shadow-xs ring-1 ring-black/5 dark:ring-white/5 flex items-center justify-center ${tone} ${className}`}>
    <Icon icon={icon} size={18} className={spin ? 'animate-spin' : undefined} />
  </span>
);

// An icon in front of a label, with the same gap everywhere.
export const IconLabel = ({ icon, children, spin = false, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 ${className}`}>
    <Icon icon={icon} className={spin ? 'shrink-0 animate-spin' : 'shrink-0'} />
    {children}
  </span>
);

export default ICONS;
