import { h, Fragment, render } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import {
  AppShell, PageHeader, PageTabs, Card, TabbedCard, InfoTile, TILE, Button, StatusBadge, ToggleSwitch,
  Segmented, Modal, CopyField, Loading, Empty, Notice, ProgressBar, Credits, Icon, IconTile, ICONS,
  inputClass, labelClass, hintClass, useTheme, storeValue,
} from '../../src/index';
import * as R from './random';

// A gallery of every One UI element, filled with made-up sample content: a
// team workspace with projects, tasks, files and people.
//
// The address can set what is shown, which is how demo/render.mjs takes its
// screenshots: ?page=overview&dark=1&accent=amber&glass=1&modal=confirm&seed=7
// (&menu=1 on the Menus page opens a card's menu)

const params = new URLSearchParams(location.search);
if (params.has('dark')) storeValue('darkMode', params.get('dark') === '1');
if (params.has('accent')) storeValue('accentColor', params.get('accent'));
if (params.has('glass')) storeValue('surfaceGlass', params.get('glass') === '1');

const NAV = [
  { id: 'overview', label: 'Overview', icon: 'main' },
  { id: 'components', label: 'Buttons & badges', icon: 'addons', section: 'Elements' },
  { id: 'forms', label: 'Forms & settings', icon: 'settings', section: 'Elements' },
  { id: 'tables', label: 'Tables & lists', icon: 'list', section: 'Elements' },
  { id: 'menus', label: 'Menus', icon: 'menu', section: 'Elements' },
  { id: 'dialogs', label: 'Dialogs & messages', icon: 'notifications', section: 'Elements' },
  { id: 'icons', label: 'Icons', icon: 'layers', section: 'Elements' },
  { id: 'about', label: 'About', icon: 'about', section: 'Help' },
  { id: 'plain', label: 'Plain HTML version', icon: 'file', section: 'Help', href: 'plain.html' },
  { id: 'docs', label: 'Documentation', icon: 'docs', section: 'Help', href: 'https://github.com/AuxXxilium/one-ui#readme' },
];

const tone = (v) => (v > 0.85 ? 'bg-red-500' : v > 0.7 ? 'bg-amber-500' : 'bg-blue-500');
const percent = (v) => `${Math.round(v * 100)}%`;

// A labelled meter: the overview's headline tiles.
const Meter = ({ label, value, detail, color }) => (
  <div className="panel rounded-2xl px-4 py-3 space-y-2">
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{percent(value)}</span>
    </div>
    <ProgressBar value={value} tone={color || tone(value)} />
    <div className="text-xs text-gray-500 dark:text-gray-400">{detail}</div>
  </div>
);

// ---------------------------------------------------------------- pages

const Overview = () => {
  const [ws] = useState(R.workspace);
  const [people] = useState(() => R.team(5));
  const [todo] = useState(() => R.tasks(5));
  const [log] = useState(() => R.events(5));
  const [view, setView] = useState('details');
  const away = people.filter((p) => p.status !== 'success').length;

  return (
    <div className="space-y-6">
      <PageHeader icon="main" title="Overview" subtitle={`${ws.name} · ${ws.members} members · started ${ws.created}`}>
        <Button variant="outline" icon="refresh">Refresh</Button>
        <Button icon="plus">New task</Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Meter label="Progress" value={ws.progress} detail={`${R.int(10, 60)} of ${R.int(61, 90)} tasks done`} color="bg-blue-500" />
        <Meter label="Budget used" value={ws.budget} detail={`€${R.int(2, 40)},${R.int(100, 999)} of €${R.int(41, 60)},000`} />
        <Meter label="Storage" value={ws.storage} detail={`${R.int(2, 40)} GB of 50 GB`} />
        <Meter label="Happiness" value={ws.happiness} detail={`From ${R.int(20, 90)} answers`} color="bg-green-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <TabbedCard
          className="xl:col-span-2"
          value={view}
          onChange={setView}
          tabs={[
            { id: 'details', title: 'Project details', subtitle: ws.name, icon: 'info' },
            { id: 'team', title: 'Team', subtitle: away ? `${away} away or offline` : 'Everyone online', icon: 'user', iconTone: away ? 'text-amber-500' : 'text-green-600' },
          ]}
        >
          {view === 'details' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile label="Project ID" value={ws.id} />
              <InfoTile label="Owner" value={ws.owner} mono={false} />
              <InfoTile label="Contact" value={R.email(ws.owner)} />
              <InfoTile label="Office" value={ws.city} mono={false} />
              <InfoTile label="Started" value={ws.created} mono={false} />
              <InfoTile label="Version" value={R.version()} />
            </div>
          ) : (
            <div className="space-y-2">
              {people.map((p) => (
                <div key={p.name} className={`${TILE} px-3 py-2 flex items-center justify-between gap-3`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon icon="user" className="text-gray-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{p.role}</div>
                    </div>
                  </div>
                  <StatusBadge status={p.status} label={p.statusLabel} />
                </div>
              ))}
            </div>
          )}
        </TabbedCard>

        <Card title="Recent activity" subtitle="The last few things that happened" icon="history">
          <ul className="space-y-3">
            {log.map((e, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm text-gray-900 dark:text-white">{e.who} {e.text}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{e.ago}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card
        title="Tasks"
        subtitle={`${todo.filter((t) => t.done).length} of ${todo.length} done`}
        icon="check"
        actions={<Button variant="secondary" size="xs" icon="plus">Add</Button>}
      >
        <table className="data-table w-full text-sm">
          <thead>
            <tr><th>Task</th><th>Owner</th><th>Due</th><th>Status</th><th className="text-right">Actions</th></tr>
          </thead>
          <tbody>
            {todo.map((t) => (
              <tr key={t.title}>
                <td className="font-medium text-gray-900 dark:text-white">{t.title}</td>
                <td className="text-gray-600 dark:text-gray-300">{t.owner}</td>
                <td className="text-gray-600 dark:text-gray-300 whitespace-nowrap">{t.due}</td>
                <td><StatusBadge status={t.status} label={t.statusLabel} /></td>
                <td className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="xs" icon="edit" iconOnly>Edit</Button>
                  <Button variant="ghost" size="xs" icon="trash" iconOnly>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const Example = ({ title, subtitle, icon, children }) => (
  <Card title={title} subtitle={subtitle} icon={icon}>{children}</Card>
);

const Components = () => {
  const [seg, setSeg] = useState('all');
  const [tab, setTab] = useState('summary');
  return (
    <div className="space-y-6">
      <PageHeader icon="addons" title="Buttons & badges" subtitle="The small pieces every page is built from" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Example title="Button" subtitle="Seven looks, four sizes, with or without an icon" icon="zap">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="success">Success</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="xs">Extra small</Button>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button icon="download">Download</Button>
              <Button variant="outline" icon="refresh" spin>Refreshing</Button>
              <Button variant="secondary" icon="gear" iconOnly>Settings</Button>
              <Button variant="danger" icon="trash" iconOnly>Delete</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </Example>

        <Example title="StatusBadge" subtitle="A word that says how something is" icon="tag">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="success" label="Done" />
            <StatusBadge status="warning" label="Waiting" />
            <StatusBadge status="error" label="Overdue" />
            <StatusBadge status="info" label={`v${R.version()}`} />
            <StatusBadge label="Archived" />
          </div>
        </Example>

        <Example title="Segmented" subtitle="Pick one view out of a few" icon="fader">
          <Segmented
            value={seg}
            onChange={setSeg}
            items={[
              { id: 'all', label: 'All', count: R.int(20, 90) },
              { id: 'open', label: 'Open', count: R.int(3, 20) },
              { id: 'done', label: 'Done', count: R.int(3, 20) },
              { id: 'hidden', label: 'Hidden', disabled: true },
            ]}
          />
        </Example>

        <Example title="IconTile and InfoTile" subtitle="An icon in a box; one fact in a box" icon="info">
          <div className="flex items-center gap-3 mb-3">
            <IconTile icon="user" />
            <IconTile icon="success" tone="text-green-600" />
            <IconTile icon="warning" tone="text-amber-500" />
            <IconTile icon="spinner" tone="text-blue-600" spin />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoTile label="Order" value={R.code('ORD')} />
            <InfoTile label="Customer" value={R.person()} mono={false} />
            <InfoTile label="City" value={R.city()} mono={false} />
          </div>
        </Example>
      </div>

      <Card title="PageTabs" subtitle="The views of one page, across the top" icon="layers">
        <PageTabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'summary', label: 'Summary', icon: 'main' },
            { id: 'activity', label: 'Activity', icon: 'activity' },
            { id: 'files', label: 'Files', icon: 'file', count: R.int(3, 30) },
            { id: 'settings', label: 'Settings', icon: 'settings' },
          ]}
        />
      </Card>
    </div>
  );
};

const Forms = () => {
  const [opts, setOpts] = useState(() => R.settings(4));
  const [name, setName] = useState(R.person);
  return (
    <div className="space-y-6">
      <PageHeader icon="settings" title="Forms & settings" subtitle="Fields, switches and values to copy" warning="Changes here apply as soon as you flip them." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Fields" subtitle="inputClass, labelClass and hintClass" icon="edit">
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Display name</label>
              <input className={inputClass} value={name} onInput={(e) => setName(e.currentTarget.value)} />
              <p className={hintClass}>This is how others see you.</p>
            </div>
            <div>
              <label className={labelClass}>Reminder</label>
              <select className={inputClass}>
                <option>Every day at 09:00</option>
                <option>Every Monday</option>
                <option>Never</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked /> Send me an email when a task is done
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary">Cancel</Button>
              <Button>Save</Button>
            </div>
          </div>
        </Card>

        <Card title="ToggleSwitch" subtitle="On or off, applied at once" icon="power">
          <div className="space-y-1">
            {opts.map((o, i) => (
              <div key={o.name} className="flex items-center justify-between gap-3 py-1.5">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{o.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{o.hint}</div>
                </div>
                <ToggleSwitch
                  label={o.name}
                  checked={o.on}
                  onChange={(on) => setOpts(opts.map((x, j) => (j === i ? { ...x, on } : x)))}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card title="CopyField" subtitle="Click the value to copy it" icon="copy" className="xl:col-span-2">
          <div className="space-y-2">
            <CopyField label="Share link:" value={`https://example.com/share/${R.token().slice(0, 10)}`} />
            <CopyField label="Sample key:" value={R.token()} />
          </div>
        </Card>
      </div>
    </div>
  );
};

const Tables = () => {
  const [list] = useState(() => R.files(7));
  return (
    <div className="space-y-6">
      <PageHeader icon="list" title="Tables & lists" subtitle="Rows of things, with a quiet header" />
      <Card title="Files" subtitle={`${list.length} files`} icon="file" actions={<Button variant="outline" size="xs" icon="upload">Upload</Button>}>
        <table className="data-table w-full text-sm">
          <thead>
            <tr><th>Name</th><th>Type</th><th className="text-right">Size</th><th>Owner</th><th>Modified</th><th>Status</th></tr>
          </thead>
          <tbody>
            {list.map((f) => (
              <tr key={f.name}>
                <td className="font-medium text-gray-900 dark:text-white">{f.name}</td>
                <td className="text-gray-600 dark:text-gray-300">{f.type}</td>
                <td className="text-right tabular-nums">{f.size}</td>
                <td className="text-gray-600 dark:text-gray-300">{f.owner}</td>
                <td className="text-gray-600 dark:text-gray-300 whitespace-nowrap">{f.modified}</td>
                <td><StatusBadge status={f.status} label={f.statusLabel} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Loading" subtitle="While something is on its way" icon="spinner">
          <Loading message="Loading files…" size={10} className="py-6" />
        </Card>
        <Card title="Empty" subtitle="When there is nothing to show" icon="package">
          <Empty icon="file">No files in this folder yet.</Empty>
        </Card>
      </div>
    </div>
  );
};

const MENU = [
  { label: 'Open', icon: 'external' },
  { label: 'Rename', icon: 'edit' },
  { label: 'Duplicate', icon: 'copy' },
  { label: 'Share link', icon: 'link' },
  { label: 'Archive', icon: 'package' },
  '-',
  { label: 'Delete', icon: 'trash', danger: true },
];

// A card's "..." menu, built the way the README says: panel panel-menu, so
// under glass it is clearer than the cards it floats over, and rows that mark
// hover and the divider with a tint. The button carries aria-expanded, which
// is what lifts the card above the ones after it while the menu is open.
const ProjectCard = ({ p, startOpen }) => {
  const [open, setOpen] = useState(startOpen);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <Card overflow="visible">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <IconTile icon="layers" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{p.owner} · {p.members} members</div>
          </div>
        </div>
        <div className="relative shrink-0" ref={ref}>
          <Button variant="secondary" size="xs" icon="more" iconOnly aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            More actions
          </Button>
          {open && (
            <div role="menu" className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl panel panel-menu shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-1">
              {MENU.map((item, i) => (item === '-' ? (
                <div key={i} role="separator" className="my-1 mx-1.5 h-px bg-black/10 dark:bg-white/10" />
              ) : (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-left hover:bg-black/5 dark:hover:bg-white/10 ${
                    item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <Icon icon={item.icon} size={16} />{item.label}
                </button>
              )))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{p.done} of {p.total} tasks</span>
          <span>due {p.due}</span>
        </div>
        <ProgressBar value={p.done / p.total} />
      </div>
      <div className="mt-3">
        <StatusBadge status={p.status} label={p.statusLabel} />
      </div>
    </Card>
  );
};

const Menus = () => {
  const [list] = useState(() => R.projects(6));
  return (
    <div className="space-y-6">
      <PageHeader icon="menu" title="Menus" subtitle="A card's ... menu, floating over the cards around it" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p, i) => (
          <ProjectCard key={p.name} p={p} startOpen={i === 1 && params.get('menu') === '1'} />
        ))}
      </div>
    </div>
  );
};

const Dialogs = ({ initial }) => {
  const [open, setOpen] = useState(initial);
  const [notes, setNotes] = useState(['info', 'success', 'warning', 'error']);
  const proj = `Project ${R.project()}`;
  const file = R.files(1)[0].name;
  const texts = {
    info: `${R.person()} invited you to ${proj}.`,
    success: `${file} was uploaded.`,
    warning: `${R.int(2, 6)} tasks are due tomorrow.`,
    error: 'The file could not be saved. Please try again.',
  };
  return (
    <div className="space-y-6">
      <PageHeader icon="notifications" title="Dialogs & messages" subtitle="Things that ask, confirm or tell" />
      <Card title="Modal" subtitle="A dialog over the page" icon="monitor">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setOpen('info')}>Open a dialog</Button>
          <Button variant="danger" onClick={() => setOpen('confirm')}>Ask to confirm</Button>
          <Button variant="success" onClick={() => setOpen('success')}>Show success</Button>
        </div>
      </Card>
      <Card title="Notice" subtitle="A message in a tinted box; can be closed" icon="info">
        <div className="space-y-2">
          {notes.map((t) => (
            <Notice key={t} tone={t} onClose={() => setNotes(notes.filter((n) => n !== t))}>{texts[t]}</Notice>
          ))}
          {!notes.length && <Button variant="secondary" size="xs" onClick={() => setNotes(['info', 'success', 'warning', 'error'])}>Show them again</Button>}
        </div>
      </Card>

      <Modal isOpen={open === 'info'} onClose={() => setOpen(null)} title={proj}>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile label="Owner" value={R.person()} mono={false} />
          <InfoTile label="Project ID" value={R.code('PRJ', 4)} />
        </div>
      </Modal>
      <Modal
        isOpen={open === 'confirm'}
        onClose={() => setOpen(null)}
        title="Delete this file?"
        size="sm"
        onConfirm={() => setOpen('success')}
        confirmLabel="Delete"
        confirmVariant="danger"
        message={`${file} will be removed from ${proj} for good. Copies other people downloaded are not touched.`}
      />
      <Modal isOpen={open === 'success'} onClose={() => setOpen(null)} type="success" title="Done" message="The file was deleted." />
    </div>
  );
};

const Icons = () => (
  <div className="space-y-6">
    <PageHeader icon="layers" title="Icons" subtitle={`${Object.keys(ICONS).length} line icons, by name: <Icon icon="refresh" />`} />
    <Card>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
        {Object.keys(ICONS).map((name) => (
          <div key={name} className={`${TILE} flex flex-col items-center gap-1.5 py-3 px-1`}>
            <Icon icon={name} size={20} className="text-gray-700 dark:text-gray-200" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-full">{name}</span>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const About = () => (
  <div className="space-y-6">
    <PageHeader icon="about" title="About" subtitle="Who makes One UI" />
    <Card>
      <div className="flex items-center gap-5">
        <span className="w-16 h-16 shrink-0 rounded-2xl bg-linear-to-br from-blue-400 to-blue-600 text-on-accent flex items-center justify-center text-2xl font-bold">1</span>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">One UI</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            A UI to rule them all.
          </p>
        </div>
      </div>
    </Card>
    <Card title="Credits" subtitle="Required wherever One UI is used" icon="heart">
      <Credits />
    </Card>
  </div>
);

// ---------------------------------------------------------------- app

const PAGES = { overview: Overview, components: Components, forms: Forms, tables: Tables, menus: Menus, dialogs: Dialogs, icons: Icons, about: About };

const App = () => {
  const theme = useTheme();
  const [page, setPage] = useState(PAGES[params.get('page')] ? params.get('page') : 'overview');
  const Page = PAGES[page];
  return (
    <AppShell
      logo={<span className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-400 to-blue-600 text-on-accent flex items-center justify-center font-bold">1</span>}
      title="One UI"
      subtitle={`A UI to rule them all · demo seed ${R.SEED}`}
      theme={theme}
      nav={NAV}
      active={page}
      onSelect={setPage}
    >
      <Page initial={params.get('modal')} />
    </AppShell>
  );
};

render(<App />, document.getElementById('app'));
