import { createContext } from 'preact';

// True inside a window of the desktop. The window's title bar already names
// the page with its icon, so PageHeader leaves out its own icon tile and
// title there and keeps what only it says: the subtitle, a warning and the
// page's buttons.
export const InWindow = createContext(false);
