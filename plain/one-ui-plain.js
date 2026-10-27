/* One UI plain theme script - by AuxXxilium, design by Fulcrum. Built from plain/entry.js; do not edit. */
(() => {
  // src/theme.js
  var DEFAULT_ACCENT = "blue";
  var DARK_ON = "26 26 26";
  var ACCENT_PRESETS = [
    {
      id: "red",
      label: "Red",
      shades: {
        50: "254 242 242",
        100: "254 226 226",
        200: "254 202 202",
        300: "252 165 165",
        400: "248 113 113",
        500: "232 68 68",
        600: "209 43 43",
        700: "176 32 32",
        800: "146 28 28",
        900: "122 28 28",
        950: "69 10 10"
      }
    },
    {
      id: "blue",
      label: "Blue",
      shades: {
        50: "239 246 255",
        100: "219 234 254",
        200: "191 219 254",
        300: "147 197 253",
        400: "96 165 250",
        500: "59 130 246",
        600: "37 99 235",
        700: "29 78 216",
        800: "30 64 175",
        900: "30 58 138",
        950: "23 37 84"
      }
    },
    {
      id: "amber",
      label: "Amber",
      on: DARK_ON,
      swatch: 500,
      shades: {
        50: "255 251 235",
        100: "254 243 199",
        200: "253 230 138",
        300: "253 224 138",
        400: "252 211 77",
        500: "251 191 36",
        600: "245 158 11",
        700: "217 119 6",
        800: "120 53 15",
        900: "69 26 3",
        950: "50 19 2"
      }
    },
    {
      id: "graphite",
      label: "Graphite",
      shades: {
        50: "248 250 252",
        100: "241 245 249",
        200: "226 232 240",
        300: "203 213 225",
        400: "148 163 184",
        500: "100 116 139",
        600: "71 85 105",
        700: "51 65 85",
        800: "30 41 59",
        900: "15 23 42",
        950: "2 6 23"
      }
    },
    // Soft at 400-600, where buttons and the dot are, and dark from 700 down,
    // so the light theme's 700 labels still read on white (5:1).
    {
      id: "green",
      label: "Pastel Green",
      on: DARK_ON,
      shades: {
        50: "240 253 244",
        100: "220 252 231",
        200: "193 241 211",
        300: "160 228 186",
        400: "134 214 164",
        500: "110 199 145",
        600: "88 180 125",
        700: "46 125 80",
        800: "32 96 61",
        900: "22 70 45",
        950: "12 40 26"
      }
    }
  ];
  var RETIRED = {
    orange: "amber",
    slate: "graphite",
    rose: "red",
    fuchsia: "red",
    emerald: "green",
    lime: "green",
    cyan: "blue",
    violet: "blue"
  };
  var findPreset = (id) => ACCENT_PRESETS.find((p) => p.id === id);
  function applyAccent(id, fallback = DEFAULT_ACCENT) {
    if (typeof document === "undefined") return;
    const preset = findPreset(id) || findPreset(fallback) || findPreset(DEFAULT_ACCENT);
    const root = document.documentElement;
    Object.keys(preset.shades).forEach((shade) => {
      root.style.setProperty(`--accent-${shade}`, preset.shades[shade]);
    });
    root.style.setProperty("--accent-on", preset.on || "255 255 255");
  }
  function applyDark(on) {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", !!on);
  }
  function applyGlass(on) {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("glass", !!on);
  }
  function readStoredAccent(key = "accentColor", fallback = DEFAULT_ACCENT) {
    try {
      let saved = localStorage.getItem(key);
      if (saved && RETIRED[saved]) saved = RETIRED[saved];
      if (saved && findPreset(saved)) return saved;
    } catch (e) {
    }
    return fallback;
  }
  function readStoredDark(key = "darkMode") {
    try {
      const saved = localStorage.getItem(key);
      if (saved === "true" || saved === "false") return saved === "true";
    } catch (e) {
    }
    return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function readStoredGlass(key = "surfaceGlass") {
    try {
      return localStorage.getItem(key) === "true";
    } catch (e) {
      return false;
    }
  }
  function storeValue(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (e) {
    }
  }

  // plain/entry.js
  var opts = document.currentScript && document.currentScript.dataset || {};
  var ACCENT_KEY = opts.accentKey || "accentColor";
  var DARK_KEY = opts.darkKey || "darkMode";
  var GLASS_KEY = opts.glassKey || "surfaceGlass";
  var DEFAULT = opts.defaultAccent || "blue";
  function applyAll() {
    applyDark(readStoredDark(DARK_KEY));
    applyAccent(readStoredAccent(ACCENT_KEY, DEFAULT), DEFAULT);
    applyGlass(readStoredGlass(GLASS_KEY));
  }
  applyAll();
  window.addEventListener("storage", (e) => {
    if (e.key === null || e.key === DARK_KEY || e.key === ACCENT_KEY || e.key === GLASS_KEY) applyAll();
  });
  window.OneUI = {
    presets: ACCENT_PRESETS,
    setDark(on) {
      storeValue(DARK_KEY, !!on);
      applyAll();
    },
    setAccent(id) {
      storeValue(ACCENT_KEY, id);
      applyAll();
    },
    setGlass(on) {
      storeValue(GLASS_KEY, !!on);
      applyAll();
    },
    get dark() {
      return readStoredDark(DARK_KEY);
    },
    get accent() {
      return readStoredAccent(ACCENT_KEY, DEFAULT);
    },
    get glass() {
      return readStoredGlass(GLASS_KEY);
    }
  };
})();
