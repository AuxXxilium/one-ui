import { h } from 'preact';
import { useState } from 'preact/hooks';
import Sidebar from './Sidebar';
import AppearanceMenu from './AppearanceMenu';
import Credits from './Credits';
import { Icon } from '../icons';

const wideScreen = () => typeof window === 'undefined' || !window.matchMedia || window.matchMedia('(min-width: 768px)').matches;

// The whole frame of an app: a title bar across the top, the page list down
// the left and the page itself on the right, all on the accent-washed ground.
//
// The title bar has no background of its own: it sits on the wash with the
// sidebar, the way a desktop app's title bar does, so the cards are the only
// white on the page.
//
//   logo, title, subtitle   the app's name in the title bar (logo: an image
//                           URL or anything to render)
//   actions                 extra buttons beside the appearance menu
//   theme                   what useTheme returns; adds the appearance menu
//   nav, active, onSelect   the Sidebar's items and the current page
//   credits                 the One UI credit at the foot of the sidebar; on
//                           by default, see NOTICE before turning it off
const AppShell = ({ logo, title, subtitle, actions, theme, nav = [], active, onSelect, credits = true, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(wideScreen);

  return (
    <div className="flex h-screen flex-col app-wash text-gray-900 dark:text-gray-100">
      <header className="shrink-0 px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {typeof logo === 'string' ? <img src={logo} alt="" className="h-10 w-10 shrink-0" /> : logo}
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white truncate">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {nav.length > 0 && (
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle sidebar"
                aria-expanded={sidebarOpen}
              >
                <Icon icon="menu" size={22} />
              </button>
            )}
            {actions}
            {theme && <AppearanceMenu {...theme} />}
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden min-h-0">
        {nav.length > 0 && (
          <Sidebar
            items={nav}
            active={active}
            onSelect={(id) => {
              onSelect(id);
              // On a phone the sidebar covers the page, so choosing one closes it.
              if (!wideScreen()) setSidebarOpen(false);
            }}
            open={sidebarOpen}
            footer={credits ? <Credits compact /> : null}
          />
        )}
        <main className="flex-1 min-w-0 overflow-auto p-4 sm:p-6 sm:pl-3">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
