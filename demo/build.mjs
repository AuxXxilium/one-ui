// Builds the plain theme script and the demo.
//   node demo/build.mjs    (npm run build)
//
// plain/one-ui-plain.js     from plain/entry.js and src/theme.js
// demo/demo.js, demo.css    the demo, from demo/src
//
// The built files are committed: GitHub Pages serves the repository as it
// is, so the demo at /demo/ is exactly what is in this folder. Run this and
// commit the result after changing anything in src/, plain/ or demo/src/.
import * as esbuild from 'esbuild';
import { spawn } from 'node:child_process';

// The plain theme script stays readable: pages outside this repository load
// it as it is, and someone will open it to see what it does.
await esbuild.build({
  entryPoints: ['plain/entry.js'],
  bundle: true,
  outfile: 'plain/one-ui-plain.js',
  format: 'iife',
  target: ['es2017'],
  banner: { js: '/* One UI plain theme script - by AuxXxilium, design by Fulcrum. Built from plain/entry.js; do not edit. */' },
  logLevel: 'info',
});

// Classic JSX with h. An app on the automatic runtime reads the same files,
// since each imports h and Fragment.
const demo = esbuild.build({
  entryPoints: ['demo/src/main.jsx'],
  bundle: true,
  outfile: 'demo/demo.js',
  format: 'iife',
  jsx: 'transform',
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  minify: true,
  target: ['es2020'],
  logLevel: 'info',
});

const css = new Promise((resolve, reject) => {
  const p = spawn(process.execPath, ['node_modules/@tailwindcss/cli/dist/index.mjs', '-i', 'demo/src/demo.css', '-o', 'demo/demo.css', '--minify'], { stdio: 'inherit' });
  p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`tailwind exited with ${code}`))));
});

await Promise.all([demo, css]);
