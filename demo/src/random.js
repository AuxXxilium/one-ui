// Sample content for the demo: a made-up team workspace with projects,
// tasks, files and people. None of it is real.
//
// Seeded, so the same ?seed= in the address always shows the same "random"
// page - the screenshots in docs/ stay put between renders - and a page
// without one gets a new seed each load.

const params = new URLSearchParams(location.search);
export const SEED = Number(params.get('seed')) || Math.floor(Math.random() * 1e6);

// mulberry32: small and good enough for picking sample words.
let state = SEED >>> 0;
export const rand = () => {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
export const pick = (list) => list[Math.floor(rand() * list.length)];
export const pickSome = (list, n) => [...list].sort(() => rand() - 0.5).slice(0, n);

const PROJECTS = ['Apollo', 'Borealis', 'Cascade', 'Driftwood', 'Ember', 'Fjord', 'Granite', 'Harbor', 'Juniper', 'Lumen'];
const PEOPLE = ['Mira Holt', 'Jonas Weber', 'Aiko Tanaka', 'Leo Duarte', 'Sara Lind', 'Noah Becker', 'Elena Ruiz', 'Tom Hayes', 'Priya Nair', 'Omar Haddad'];
const ROLES = ['Designer', 'Developer', 'Product lead', 'Writer', 'Researcher', 'Support'];
const CITIES = ['Lisbon', 'Oslo', 'Kyoto', 'Toronto', 'Cape Town', 'Melbourne', 'Vienna', 'Bogotá'];
const TASKS = [
  'Write the welcome email', 'Update the price list', 'Review the new logo', 'Plan the team offsite',
  'Fix the signup form', 'Translate the help pages', 'Order new chairs', 'Prepare the monthly report',
  'Call the printer', 'Test the mobile layout', 'Clean up old files', 'Book the meeting room',
];
const FILES = [
  ['Brand guide', 'pdf'], ['Budget 2026', 'xlsx'], ['Team photo', 'jpg'], ['Meeting notes', 'docx'],
  ['Launch plan', 'pdf'], ['Product video', 'mp4'], ['Logo', 'svg'], ['Contracts', 'zip'], ['Survey results', 'csv'],
];
const EVENTS = [
  'commented on', 'finished', 'uploaded a file to', 'joined', 'renamed a task in', 'shared', 'archived a task in',
];

export const project = () => pick(PROJECTS);
export const person = () => pick(PEOPLE);
export const city = () => pick(CITIES);
export const version = () => `${int(1, 9)}.${int(0, 20)}.${int(0, 99)}`;
export const pct = (min = 3, max = 97) => int(min, max) / 100;
export const code = (prefix, digits = 5) => `${prefix}-${String(int(0, 10 ** digits - 1)).padStart(digits, '0')}`;
export const email = (name) => `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`;
export const token = () => Array.from({ length: 32 }, () => int(0, 15).toString(16)).join('');
export const date = () => `${int(1, 28)} ${pick(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])}`;

export const workspace = () => ({
  name: `Project ${project()}`,
  owner: person(),
  members: int(4, 24),
  city: city(),
  id: code('PRJ', 4),
  created: date(),
  progress: pct(20, 90),
  budget: pct(30, 95),
  storage: pct(10, 80),
  happiness: pct(60, 98),
});

export const team = (n) => pickSome(PEOPLE, n).map((name) => {
  const s = rand();
  const status = s < 0.55 ? 'success' : s < 0.8 ? 'warning' : 'default';
  return {
    name,
    role: pick(ROLES),
    status,
    statusLabel: { success: 'Online', warning: 'Away', default: 'Offline' }[status],
  };
});

export const tasks = (n) => pickSome(TASKS, n).map((title) => {
  const s = rand();
  const status = s < 0.4 ? 'success' : s < 0.7 ? 'info' : s < 0.88 ? 'warning' : 'error';
  return {
    title,
    owner: person(),
    due: date(),
    status,
    statusLabel: { success: 'Done', info: 'In progress', warning: 'Waiting', error: 'Overdue' }[status],
    done: status === 'success',
  };
});

export const files = (n) => pickSome(FILES, n).map(([name, ext]) => {
  const s = rand();
  const status = s < 0.7 ? 'success' : s < 0.9 ? 'info' : 'warning';
  return {
    name: `${name}.${ext}`,
    type: ext.toUpperCase(),
    size: `${(rand() * 40 + 0.2).toFixed(1)} MB`,
    owner: person(),
    modified: date(),
    status,
    statusLabel: { success: 'Shared', info: 'Private', warning: 'Draft' }[status],
  };
});

export const settings = (n) => pickSome([
  ['Email updates', 'A message when something changes'],
  ['Weekly summary', 'Every Monday morning'],
  ['Push notifications', 'On your phone'],
  ['Show completed tasks', 'In every list'],
  ['Sounds', 'When a task is finished'],
], n).map(([name, hint]) => ({ name, hint, on: rand() < 0.6 }));

export const events = (n) => Array.from({ length: n }, () => ({
  who: person(),
  text: `${pick(EVENTS)} ${pick(PROJECTS)}`,
  ago: `${int(1, 59)} min ago`,
}));
