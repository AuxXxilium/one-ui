import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { subscribeToasts, dismissToast, toast } from '../toast';
import { Icon } from '../icons';

// The toasts of toast.js, at the bottom middle of the screen on the clearer
// glass of a menu. A click dismisses one early. Read aloud as a status,
// without taking the focus.
//
// AppShell draws one already. An app with its own frame puts <Toaster /> in
// once, anywhere.
const Toaster = () => {
  const [items, setItems] = useState([]);
  useEffect(() => subscribeToasts(setItems), []);
  return (
    // Kept in the page while empty: a live region that appears with its first
    // message is not announced by every screen reader. On a phone it sits
    // higher, clear of AppShell's round menu button. z-60: above dialogs
    // (z-50), so a confirmation from inside one is seen.
    <div
      className="fixed inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] max-md:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {items.map((x) => (
        <button
          key={x.id}
          type="button"
          onClick={() => dismissToast(x.id)}
          className="pointer-events-auto max-w-[min(36rem,100%)] flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl panel panel-menu ring-1 ring-black/5 dark:ring-white/10 text-sm text-left text-gray-800 dark:text-gray-100 animate-[oui-rise-in_160ms_ease-out]"
        >
          <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
            x.kind === 'info'
              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
              : 'bg-green-500/15 text-green-600 dark:text-green-400'
          }`}>
            <Icon icon={x.kind === 'info' ? 'info' : 'check'} size={13} />
          </span>
          <span className="min-w-0">{x.message}</span>
        </button>
      ))}
    </div>
  );
};

// In place of a page's `const [notice, setNotice] = useState('')`: a
// confirmation set through it becomes a toast and is not kept on the page.
// Only an error, given as { ok: false, text }, is kept, for the page to show
// beside what failed.
//
//   const [error, setNotice] = useNotice();
//   setNotice('Saved.');                 // a toast; error stays ''
//   setNotice({ ok: true, text });       // a toast
//   setNotice({ ok: false, text });      // kept: error is the object
//   setNotice('')                        // clears what is kept
export const useNotice = () => {
  const [kept, setKept] = useState('');
  const set = (v) => {
    if (v && typeof v === 'object' && !Array.isArray(v) && 'ok' in v) {
      if (v.ok) { toast(v.text); setKept(''); } else setKept(v);
      return;
    }
    if (v) toast(v);
    setKept('');
  };
  return [kept, set];
};

export default Toaster;
