// Builds the plain-CSS theme script and the demo.
//   node demo/build.mjs    (npm run build)
//
// plain/one-ui-plain.js   from plain/entry.js and src/theme.js
// demo/dist/              the demo: open demo/dist/index.html, or plain.html
import * as esbuild from 'esbuild';
import { spawn } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';

rmSync('demo/dist', { recursive: true, force: true });
mkdirSync('demo/dist', { recursive: true });

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
  entryPoints: ['demo/main.jsx'],
  bundle: true,
  outfile: 'demo/dist/demo.js',
  format: 'iife',
  jsx: 'transform',
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  minify: true,
  target: ['es2020'],
  logLevel: 'info',
});

const css = new Promise((resolve, reject) => {
  const p = spawn(process.execPath, ['node_modules/@tailwindcss/cli/dist/index.mjs', '-i', 'demo/demo.css', '-o', 'demo/dist/demo.css', '--minify'], { stdio: 'inherit' });
  p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`tailwind exited with ${code}`))));
});

await Promise.all([demo, css]);

copyFileSync('demo/index.html', 'demo/dist/index.html');
copyFileSync('demo/plain.html', 'demo/dist/plain.html');
copyFileSync('plain/one-ui-plain.css', 'demo/dist/one-ui-plain.css');
copyFileSync('plain/one-ui-plain.js', 'demo/dist/one-ui-plain.js');
