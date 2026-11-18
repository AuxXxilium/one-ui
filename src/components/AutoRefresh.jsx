import { h } from 'preact';
import { useState } from 'preact/hooks';
import Button from './Button';
import ToggleSwitch from './ToggleSwitch';

// Auto-refresh for a page whose figures move - a monitor, a queue, a log - as
// arc-control's pages have it, from Firevisor: a switch named Auto-refresh and
// a Refresh button beside it, for the page header. Off, the page polls nothing
// and shows its last reading until Refresh is pressed.
//
//   const [live, setLive] = useAutoRefresh('monitor');
//   useVisiblePoll(load, 5000, live);
//   <PageHeader …><AutoRefresh on={live} onChange={setLive} onRefresh={load} every={5} /></PageHeader>
//
// useAutoRefresh remembers the choice per page in this browser: how one
// person likes to read a page. On by default.
const keyOf = (page) => `oneui_autorefresh:${page}`;

export const useAutoRefresh = (page, initial = true) => {
  const [on, setOn] = useState(() => {
    try {
      const saved = localStorage.getItem(keyOf(page));
      return saved ? saved === 'on' : initial;
    } catch (e) {
      return initial;
    }
  });
  const set = (next) => {
    setOn(next);
    try { localStorage.setItem(keyOf(page), next ? 'on' : 'off'); } catch (e) { /* this visit only */ }
  };
  return [on, set];
};

//   on, onChange(next)   the switch
//   onRefresh            one reading now; leave it out for no button
//   busy                 a reading is under way: the arrows turn, the button waits
//   every                the polling interval in seconds, for the tooltip
//   label, refreshLabel  the words, for an app in another language
const AutoRefresh = ({ on, onChange, onRefresh, busy = false, every, label = 'Auto-refresh', refreshLabel = 'Refresh' }) => (
  <div className="flex items-center gap-3">
    <span title={every ? `Updating every ${every}s` : undefined}>
      <ToggleSwitch checked={on} onChange={onChange}>{label}</ToggleSwitch>
    </span>
    {onRefresh && (
      <Button variant="secondary" icon="refresh" spin={busy} onClick={onRefresh} disabled={busy}>
        {refreshLabel}
      </Button>
    )}
  </div>
);

export default AutoRefresh;
