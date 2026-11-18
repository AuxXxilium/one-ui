// Short confirmations - "Saved.", "Link copied." - as a note at the bottom
// middle of the screen for three seconds, instead of a line that stays on the
// page until someone closes it. From Firevisor.
//
// Errors do not belong here: one that disappears is easily missed, and an
// error usually asks for something to be done, so it stays on the page beside
// what failed (a Notice).
//
//   toast('Saved.')               a confirmation, with a green tick
//   toast('Synced 4 files', 'info')  a neutral note, in the accent
//   subscribeToasts(fn)           -> unsubscribe; for <Toaster>
//
// No Preact in this file, so a plain page can use it too: one-ui-plain.js
// has it as OneUI.toast().

export const TOAST_MS = 3000;
// More than this at once and the oldest gives way: a burst of saves does not
// stack up the screen.
const MAX = 3;

let seq = 0;
let list = [];
const subs = new Set();
const emit = () => subs.forEach((fn) => fn(list));

export const dismissToast = (id) => {
  const before = list.length;
  list = list.filter((x) => x.id !== id);
  if (list.length !== before) emit();
};

export const toast = (message, kind = 'success') => {
  if (message == null || message === '' || message === false) return;
  seq += 1;
  const id = seq;
  // The same words twice in a row are one toast, shown again from the start.
  list = list.filter((x) => x.message !== message);
  list = [...list, { id, message, kind }].slice(-MAX);
  emit();
  setTimeout(() => dismissToast(id), TOAST_MS);
};

export const subscribeToasts = (fn) => {
  subs.add(fn);
  fn(list);
  return () => subs.delete(fn);
};
