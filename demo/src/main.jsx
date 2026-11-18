import { h, Fragment, render } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import {
  AppShell, PageHeader, PageTabs, Card, TabbedCard, InfoTile, TILE, Button, StatusBadge, ToggleSwitch,
  Segmented, Modal, CopyField, Loading, Empty, Notice, ProgressBar, Credits, Icon, IconTile, ICONS,
  ContextMenu, MenuButton, StatsWidget, formatBytes, useNoBrowserMenu, useVisiblePoll, TimePicker,
  Chips, Ring, AutoRefresh, useAutoRefresh, toast, useNotice, openMedia,
  RestartScreen, useWallpaper, useLayout,
  inputClass, labelClass, hintClass, useTheme, storeValue,
} from '../../src/index';
import * as R from './random';
import { mediaFolder } from './media';

// A gallery of every One UI element, filled with made-up sample content: a
// team workspace with projects, tasks, files and people.
//
// The address can set what is shown, which is how demo/render.mjs takes its
// screenshots: ?page=overview&dark=1&accent=amber&glass=1&modal=confirm&seed=7
// On the Menus page &menu=1 opens a card's "..." menu and &ctx=1 a card's
// right-click menu; &widget=1 opens the host widget and &widget=0 leaves it
// out. A signed-in user's menu sits top right, holding the appearance
// choices; &account=0 shows the plain sun/moon appearance menu instead.
// &open=account opens the user's menu, &open=look its appearance choices, and
// &open=pages the phone's page menu. &layout=desktop shows the desktop, with
// &windows=a,b open and &open=launcher its launcher; &wallpaper= picks one. &sub=1 with &menu=1 opens the card
// menu's "Move to" submenu; &toast=1 shows a toast, &help=1 the Overview's
// help; &media=image opens the lightbox and &media=audio the music player
// (on the Tables page, Pictures & music), and &rowmenu=1 a file's "..." menu.

const params = new URLSearchParams(location.search);
if (params.has('dark')) storeValue('darkMode', params.get('dark') === '1');
if (params.has('accent')) storeValue('accentColor', params.get('accent'));
if (params.has('glass')) storeValue('surfaceGlass', params.get('glass') === '1');
if (params.has('wallpaper')) storeValue('wallpaper', params.get('wallpaper'));
if (params.has('layout')) storeValue('uiLayout', params.get('layout'));
// A fresh desktop for the renders, with these windows open: &windows=a,b
if (params.has('windows')) {
  try { localStorage.removeItem('oneui_desktop'); } catch (e) { /* none kept */ }
}

// Some pages carry notification bubbles: a count, or several with a tone.
const NAV = [
  { id: 'overview', label: 'Overview', icon: 'main' },
  { id: 'components', label: 'Buttons & badges', icon: 'addons', section: 'Elements' },
  { id: 'forms', label: 'Forms & settings', icon: 'settings', section: 'Elements', badge: { n: 1, tone: 'quiet', title: '1 draft saved' } },
  { id: 'tables', label: 'Tables & lists', icon: 'list', section: 'Elements', badge: [{ n: 4, title: '4 tasks in progress' }, { n: 2, tone: 'success', title: '2 tasks done' }] },
  { id: 'menus', label: 'Menus', icon: 'menu', section: 'Elements' },
  { id: 'dialogs', label: 'Dialogs & messages', icon: 'notifications', section: 'Elements', badge: { n: 3, tone: 'danger', title: '3 unread messages' } },
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
  const [live, setLive] = useAutoRefresh('overview');
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(params.get('help') === '1');
  const away = people.filter((p) => p.status !== 'success').length;
  // A pretend reload, so the arrows have something to turn for.
  const refresh = () => {
    setBusy(true);
    setTimeout(() => { setBusy(false); toast('Up to date.'); }, 700);
  };

  return (
    <div className="space-y-6">
      <PageHeader icon="main" title="Overview" subtitle={`${ws.name} · ${ws.members} members · started ${ws.created}`} onHelp={() => setHelp(true)}>
        <AutoRefresh on={live} onChange={setLive} onRefresh={refresh} busy={busy} every={30} />
        <Button icon="plus">New task</Button>
      </PageHeader>
      <Modal isOpen={help} onClose={() => setHelp(false)} title="About this page" size="sm">
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p>The overview shows how {ws.name} stands: progress, budget, storage and how the team feels about it.</p>
          <p>With Auto-refresh on, the figures are read again every 30 seconds while the page is open. Off, they stay as they are until you press Refresh.</p>
        </div>
      </Modal>

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

        <Example title="Chips" subtitle="Figures as badges; one thing's figures joined in one pill" icon="tag">
          <div className="space-y-3">
            <Chips items={[
              { label: `${R.int(3, 9)} online`, status: 'success' },
              { label: `${R.int(1, 3)} away`, status: 'warning' },
              { label: `${R.int(1, 4)} offline` },
              { label: 'Admin', tone: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300' },
            ]} />
            <div className="flex flex-wrap items-center gap-2">
              <Chips joined items={[
                { label: `${R.int(4, 30)} GB free`, status: 'success' },
                { label: '50 GB in all' },
              ]} />
              <Chips joined items={[
                { label: `${(R.rand() * 9 + 1).toFixed(1)} MB/s`, icon: 'arrowUp', flip: true, status: 'info', title: 'Download' },
                { label: `${R.int(80, 900)} KB/s`, icon: 'arrowUp', status: 'info', title: 'Upload' },
              ]} />
              <Chips joined items={[{ label: 'USB' }, { label: 'xhci_hcd', mono: true }]} />
            </div>
          </div>
        </Example>

        <Example title="Ring" subtitle="A share of a whole, as a dial" icon="gauge">
          <div className="flex flex-wrap items-start gap-6">
            <Ring label="Storage" pct={R.int(20, 60)} />
            <Ring label="Budget" pct={R.int(72, 88)} />
            <Ring label="Seats" pct={R.int(91, 99)} />
            <Ring label="Not measured" pct={null} />
            <Ring label="Cores given" pct={R.int(110, 160)} tone="text-blue-500" sub="of 16" size={64} />
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
  const [compact, setCompact] = useState(true);
  const [people] = useState(() => R.team(4));
  const [picked, setPicked] = useState(() => [0, 2]);
  const [notify, setNotify] = useState('mentions');
  const [error, setNotice] = useNotice();
  const [from, setFrom] = useState('08:30');
  const [until, setUntil] = useState('');
  // For the renders: &open=time opens the first time picker.
  useEffect(() => {
    if (params.get('open') !== 'time') return undefined;
    const t = setTimeout(() => document.querySelector('button[aria-label="Starts at"]')?.click(), 50);
    return () => clearTimeout(t);
  }, []);
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
            {error && <Notice tone="error">{error.text}</Notice>}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setNotice('')}>Cancel</Button>
              {/* A confirmation is a toast; an error stays on the page. */}
              <Button onClick={() => setNotice(name.trim() ? 'Saved.' : { ok: false, text: 'A display name is needed.' })}>Save</Button>
            </div>
          </div>
        </Card>

        <Card title="TimePicker" subtitle="A time of day on two wheels to spin" icon="clock">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Starts at</label>
              <TimePicker value={from} onChange={setFrom} label="Starts at" />
              <p className={hintClass}>In steps of 5 minutes.</p>
            </div>
            <div>
              <label className={labelClass}>Ends at</label>
              <TimePicker value={until} onChange={setUntil} step={15} start="17:00" label="Ends at" />
              <p className={hintClass}>In steps of 15 minutes, starting at 17:00.</p>
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
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
              <ToggleSwitch checked={compact} onChange={setCompact}>Compact rows</ToggleSwitch>
              <ToggleSwitch size="sm" checked={!compact} onChange={(on) => setCompact(!on)}>Small, for a toolbar</ToggleSwitch>
            </div>
          </div>
        </Card>

        <Card title="Checkboxes and radios" subtitle="Picking from a list; one choice of a few" icon="check">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className={labelClass}>Who can edit</div>
              <div className="space-y-1.5 mt-1">
                {people.map((p, i) => (
                  <label key={p.name} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={picked.includes(i)}
                      onChange={(e) => setPicked(e.currentTarget.checked ? [...picked, i] : picked.filter((x) => x !== i))}
                    />
                    {p.name}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                  <input type="checkbox" disabled checked /> Owners, always
                </label>
              </div>
            </div>
            <div>
              <div className={labelClass}>Notify me about</div>
              <div className="space-y-1.5 mt-1">
                {[['all', 'Everything'], ['mentions', 'Mentions only'], ['none', 'Nothing']].map(([id, text]) => (
                  <label key={id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input type="radio" name="notify" checked={notify === id} onChange={() => setNotify(id)} />
                    {text}
                  </label>
                ))}
              </div>
            </div>
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

const FOLDERS = ['Design', 'Finance', 'Marketing', 'Archive'];

// A file's actions, for its "..." button: a ticked entry, a submenu and a
// danger entry last.
const fileItems = (f, starred, setStarred) => [
  { label: 'Open', icon: 'external', onClick: () => toast(`Opened ${f.name}.`, 'info') },
  { label: 'Starred', checked: starred.includes(f.name), onClick: () => setStarred(starred.includes(f.name) ? starred.filter((n) => n !== f.name) : [...starred, f.name]) },
  { label: 'Move to', icon: 'swap', items: FOLDERS.map((d) => ({ label: d, onClick: () => toast(`Moved ${f.name} to ${d}.`) })) },
  { label: 'Copy link', icon: 'link', onClick: () => toast('Link copied.') },
  'separator',
  { label: 'Delete', icon: 'trash', danger: true, onClick: () => toast(`${f.name} was deleted.`) },
];

// Pictures and music: a tile each. A picture opens the lightbox with the
// folder's other pictures beside it; a piece of music starts the player, with
// the rest of the folder's music queued after it.
const MediaGrid = () => {
  const [items] = useState(mediaFolder);
  useEffect(() => {
    const want = params.get('media');
    if (!want) return;
    const at = items.findIndex((x) => x.kind === want);
    if (at >= 0) openMedia(items, at);
  }, []);
  return (
    <Card title="Pictures & music" subtitle="Click one to open it" icon="image">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
        {items.map((it, i) => (
          <button
            key={it.name}
            type="button"
            onClick={() => openMedia(items, i)}
            className={`${TILE} group overflow-hidden text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500`}
          >
            {it.kind === 'image' ? (
              <img src={it.url} alt="" className="aspect-[4/3] w-full object-cover group-hover:opacity-90 transition-opacity" />
            ) : (
              <span className="aspect-[4/3] w-full flex items-center justify-center bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <Icon icon="music" size={28} />
              </span>
            )}
            <span className="block px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 truncate">{it.name}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};

const Tables = () => {
  const [list] = useState(() => R.files(7));
  const [starred, setStarred] = useState([]);
  const [view, setView] = useState(params.get('media') ? 'media' : 'files');
  // For the renders: &rowmenu=1 opens the third file's "..." menu.
  useEffect(() => {
    if (params.get('rowmenu') !== '1') return undefined;
    const t = setTimeout(() => document.querySelectorAll('td button[aria-haspopup]')[2]?.click(), 50);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="space-y-6">
      <PageHeader
        icon="list"
        title="Tables & lists"
        subtitle="Rows of things, with a quiet header"
        tabs={(
          <PageTabs
            value={view}
            onChange={setView}
            items={[
              { id: 'files', label: 'Files', icon: 'file', count: list.length },
              { id: 'media', label: 'Pictures & music', icon: 'image' },
            ]}
          />
        )}
      />
      {view === 'media' ? <MediaGrid /> : (
      <Card title="Files" subtitle={`${list.length} files`} icon="file" actions={<Button variant="outline" size="xs" icon="upload">Upload</Button>}>
        <table className="data-table w-full text-sm">
          <thead>
            <tr><th>Name</th><th>Type</th><th className="text-right">Size</th><th>Owner</th><th>Modified</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {list.map((f) => (
              <tr key={f.name}>
                <td className="font-medium text-gray-900 dark:text-white">
                  {f.name}
                  {starred.includes(f.name) && <span className="ml-1.5 text-amber-500" title="Starred">★</span>}
                </td>
                <td className="text-gray-600 dark:text-gray-300">{f.type}</td>
                <td className="text-right tabular-nums">{f.size}</td>
                <td className="text-gray-600 dark:text-gray-300">{f.owner}</td>
                <td className="text-gray-600 dark:text-gray-300 whitespace-nowrap">{f.modified}</td>
                <td><StatusBadge status={f.status} label={f.statusLabel} /></td>
                <td className="text-right"><MenuButton items={fileItems(f, starred, setStarred)} label={`Actions for ${f.name}`} className="inline-block" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      )}
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
  { label: 'Pinned', checked: true },
  { label: 'Move to', icon: 'swap', items: [
    { label: 'Design', icon: 'layers' },
    { label: 'Marketing', icon: 'layers' },
    { label: 'Finance', icon: 'layers' },
  ] },
  { label: 'Share link', icon: 'link' },
  { label: 'Archive', icon: 'package' },
  'separator',
  { label: 'Delete', icon: 'trash', danger: true },
];

// A card's "..." menu is a MenuButton with the same items as the card's
// right-click menu. Its button carries aria-expanded, which is what lifts the
// card above the ones after it under glass while the menu is open.
const ProjectCard = ({ p, startOpen, onContextMenu }) => {
  const ref = useRef(null);
  // For the renders: open this card's menu, and with &sub=1 its submenu.
  useEffect(() => {
    if (!startOpen) return undefined;
    const t = setTimeout(() => {
      ref.current?.querySelector('button[aria-haspopup]')?.click();
      if (params.get('sub') === '1') {
        setTimeout(() => {
          const row = [...document.querySelectorAll('[role=menu] button')].find((b) => b.textContent.trim() === 'Move to');
          row?.click();
        }, 50);
      }
    }, 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <Card onContextMenu={onContextMenu}>
      <div className="flex items-start justify-between gap-3" ref={ref}>
        <div className="flex items-center gap-3 min-w-0">
          <IconTile icon="layers" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{p.owner} · {p.members} members</div>
          </div>
        </div>
        <MenuButton items={MENU} label={`Actions for ${p.name}`} />
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

// The right-click menus: a card's actions on a card, and what the page header
// would offer anywhere else on the page. Not inside a dialog, which is drawn
// within the page but is not part of it.
const pageItems = [
  { label: 'New project', icon: 'plus' },
  { label: 'Import', icon: 'upload' },
  'separator',
  { label: 'Refresh', icon: 'refresh' },
  { label: 'Sort by name', icon: 'list', disabled: true, title: 'Already sorted by name' },
];

const Menus = () => {
  const [list] = useState(() => R.projects(6));
  // Opened at a spot on the fifth card for the pictures, as a right-click
  // there would.
  const [ctx, setCtx] = useState(() => (params.get('ctx') === '1'
    ? { x: 780, y: 392, title: list[4].name, items: MENU }
    : null));

  const openCardMenu = (e, p) => {
    e.preventDefault();
    e.stopPropagation();
    setCtx({ x: e.clientX, y: e.clientY, title: p.name, items: MENU });
  };
  const openPageMenu = (e) => {
    if (e.target.closest && e.target.closest('[role="dialog"]')) return;
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY, items: pageItems });
  };

  return (
    <div className="space-y-6 min-h-full" onContextMenu={openPageMenu}>
      <PageHeader icon="menu" title="Menus" subtitle="A card's ... menu, and a right-click on a card or anywhere on the page" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p, i) => (
          <ProjectCard
            key={p.name}
            p={p}
            startOpen={i === 1 && params.get('menu') === '1'}
            onContextMenu={(e) => openCardMenu(e, p)}
          />
        ))}
      </div>
      <ContextMenu menu={ctx} onClose={() => setCtx(null)} />
    </div>
  );
};

// The host widget, fed made-up readings. Polled only while it is open, through
// useVisiblePoll, the way an app would poll its backend.
const HostWidget = () => {
  const [open, setOpen] = useState(params.get('widget') === '1');
  const [stats, setStats] = useState(null);
  useVisiblePoll(async () => {
    if (open) setStats((old) => R.hostStats(old));
  }, 2000, open, open);

  return (
    <StatsWidget
      title="Host"
      open={open}
      onOpenChange={setOpen}
      loading={!stats}
      badge={stats && { text: `${stats.temp}°C`, title: 'CPU package' }}
      rings={stats ? [
        { label: 'CPU', pct: stats.cpu },
        { label: 'Memory', pct: stats.memory },
        { label: 'Storage', pct: stats.storage },
      ] : []}
      rates={stats ? [
        { label: 'Network', items: [
          { key: '↓', value: stats.rx, tone: 'bg-blue-500' },
          { key: '↑', value: stats.tx, tone: 'bg-violet-500' },
        ] },
        { label: 'Disk', items: [
          { key: 'Read', value: stats.read, tone: 'bg-green-500' },
          { key: 'Write', value: stats.write, tone: 'bg-amber-500' },
        ] },
      ] : []}
      bars={stats ? stats.volumes.map((v) => ({ label: v.name, pct: v.pct, detail: `${formatBytes(v.free)} free` })) : []}
    />
  );
};

// A server that goes down 3 seconds after being asked and, unless it was shut
// down, comes back 6 seconds after that.
const fakeServer = (kind) => {
  const t0 = Date.now();
  return async () => {
    const t = Date.now() - t0;
    return t < 3000 || (kind !== 'shutdown' && t > 9000);
  };
};

const Dialogs = ({ initial }) => {
  const [open, setOpen] = useState(initial);
  const [down, setDown] = useState(() => (params.get('restart') ? params.get('restart') : null));
  const [notes, setNotes] = useState(['info', 'success', 'warning', 'error']);
  const proj = `Project ${R.project()}`;
  const file = R.files(1)[0].name;
  const [pickFrom] = useState(() => R.files(9).concat(R.files(9)).map((f, i) => `${i + 1}. ${f.name}`));
  // For the renders: a toast as the page opens.
  useEffect(() => {
    if (params.get('toast') !== '1') return undefined;
    const t = setTimeout(() => toast(`${file} was uploaded.`), 100);
    return () => clearTimeout(t);
  }, []);
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
          <Button variant="secondary" onClick={() => setOpen('list')}>A dialog with a list</Button>
        </div>
      </Card>
      <Card title="Toast" subtitle="A short confirmation at the bottom middle, for three seconds" icon="check">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => toast('Saved.')}>Save</Button>
          <Button variant="secondary" onClick={() => toast(`${R.int(2, 9)} files synced.`, 'info')}>A neutral note</Button>
        </div>
      </Card>
      <Card title="RestartScreen" subtitle="What the page shows while the server restarts or shuts down" icon="power">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon="refresh" onClick={() => setOpen('restart')}>Restart the server</Button>
          <Button variant="danger" icon="power" onClick={() => setOpen('shutdown')}>Shut down</Button>
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
      {/* The list scrolls by itself, so the dialog's body grows to fit it
          and there is one scrollbar, not one inside another. */}
      <Modal
        isOpen={open === 'list'}
        onClose={() => setOpen(null)}
        title="Pick a file"
        onConfirm={() => { setOpen(null); toast('File attached.'); }}
        confirmLabel="Attach"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Files in {proj}:</p>
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {pickFrom.map((n) => (
            <label key={n} className={`${TILE} flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer`}>
              <input type="radio" name="pick" /> {n}
            </label>
          ))}
        </div>
      </Modal>
      <Modal
        isOpen={open === 'restart' || open === 'shutdown'}
        onClose={() => setOpen(null)}
        title={open === 'shutdown' ? 'Shut down the server?' : 'Restart the server?'}
        size="sm"
        onConfirm={() => { setDown(open); setOpen(null); }}
        confirmLabel={open === 'shutdown' ? 'Shut down' : 'Restart'}
        confirmVariant={open === 'shutdown' ? 'danger' : 'primary'}
        message="Everyone using it is signed out, and running jobs stop."
      />
      {/* A pretend server: it stops answering after a few seconds and, on a
          restart, answers again a few seconds later. Back, the screen goes
          away with a toast instead of reloading the demo. */}
      {down && (
        <RestartScreen
          kind={down}
          check={fakeServer(down)}
          onBack={() => { setDown(null); toast('The server is back.'); }}
        />
      )}
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

// The signed-in user, for the menu top right: a tag, a line about them and,
// as `extra`, anything the app wants on their card - here the storage used.
const ACCOUNT = {
  name: 'Alex Morgan',
  tag: 'Admin',
  subtitle: 'alex@example.com',
  extra: (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between text-xs text-gray-600 dark:text-gray-300">
        <span>Storage</span>
        <span className="tabular-nums text-gray-500 dark:text-gray-400">17 GB of 50 GB</span>
      </div>
      <ProgressBar value={0.34} tone="bg-blue-500" />
    </div>
  ),
  items: [
    { label: 'My profile', icon: 'user' },
    { label: 'Change password', icon: 'lock' },
    { label: 'About One UI', icon: 'info' },
    { label: 'Sign out', icon: 'logout', tone: 'danger' },
  ],
};

const PAGES = { overview: Overview, components: Components, forms: Forms, tables: Tables, menus: Menus, dialogs: Dialogs, icons: Icons, about: About };

const LOGO = <span className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-400 to-blue-600 text-on-accent flex items-center justify-center font-bold">1</span>;
const SMALL_LOGO = <span className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-400 to-blue-600 text-on-accent flex items-center justify-center text-sm font-bold">1</span>;

// A page by id, for a window of the desktop.
const renderPage = (id) => {
  const P = PAGES[id];
  return P ? <P /> : null;
};

const App = () => {
  const theme = useTheme();
  const wallpaper = useWallpaper();
  const layout = useLayout();
  const openRef = useRef(null);
  // For the renders: the windows to open on the desktop, the last in front,
  // and with &snap=1 the first two side by side.
  useEffect(() => {
    const ids = (params.get('windows') || '').split(',').filter((x) => PAGES[x]);
    if (!ids.length) return undefined;
    const t = setTimeout(() => {
      ids.forEach((id) => openRef.current?.(id));
    }, 50);
    return () => clearTimeout(t);
  }, []);
  // The demo has right-click menus of its own (on the Menus page), so the
  // browser's is turned off everywhere else, text fields aside.
  useNoBrowserMenu();
  const [page, setPage] = useState(PAGES[params.get('page')] ? params.get('page') : 'overview');
  const Page = PAGES[page];
  // For the renders: open the account menu or the phone's page menu.
  useEffect(() => {
    const open = params.get('open');
    const label = open === 'account' || open === 'look' ? 'Account' : open === 'pages' ? 'Open the menu' : null;
    if (open === 'launcher') {
      const t = setTimeout(() => document.querySelector('header.oui-bar button[title="Apps"]')?.click(), 150);
      return () => clearTimeout(t);
    }
    if (!label) return undefined;
    const t = setTimeout(() => {
      document.querySelector(`button[aria-label="${label}"]`)?.click();
      if (open === 'look') {
        setTimeout(() => [...document.querySelectorAll('[role=menu] button')].find((b) => b.textContent.trim() === 'Appearance')?.click(), 50);
      }
    }, 50);
    return () => clearTimeout(t);
  }, []);
  return (
    <AppShell
      logo={LOGO}
      title="One UI"
      subtitle={`A UI to rule them all · demo seed ${R.SEED}`}
      theme={theme}
      wallpaper={wallpaper}
      layout={layout}
      renderPage={renderPage}
      desktop={{ logo: SMALL_LOGO, openRef, initialApp: params.has('windows') ? null : page }}
      account={params.get('account') === '0' ? undefined : ACCOUNT}
      nav={NAV}
      active={page}
      onSelect={(id) => { if (PAGES[id]) setPage(id); }}
    >
      <Page initial={params.get('modal')} />
      {params.get('widget') !== '0' && <HostWidget />}
    </AppShell>
  );
};

render(<App />, document.getElementById('app'));
