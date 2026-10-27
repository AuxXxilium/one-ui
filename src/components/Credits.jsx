import { h } from 'preact';

// The credit every app built on One UI shows: AuxXxilium developed it and
// Fulcrum designed it. Both names are required wherever One UI is used (see
// NOTICE), so this is the one-line way to show them.
//
// compact: one quiet line, for a sidebar foot or a page footer. Otherwise the
// label/value rows of an About page, with any `extra` rows of the app's
// own ([{ label, name, href }]) listed first.
export const ONE_UI_CREDITS = [
  { label: 'Developed by', name: 'AuxXxilium', href: 'https://auxxxilium.tech' },
  { label: 'Theme and design', name: 'Fulcrum', href: 'https://github.com/FulcrumCode' },
];

const Link = ({ name, href }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
    {name}
  </a>
);

const Credits = ({ compact = false, extra = [], className = '' }) => {
  if (compact) {
    return (
      <p className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}>
        One UI by <Link {...ONE_UI_CREDITS[0]} /> &middot; design by <Link {...ONE_UI_CREDITS[1]} />
      </p>
    );
  }
  return (
    <div className={`space-y-3 text-sm ${className}`}>
      {[...extra, ...ONE_UI_CREDITS].map((row) => (
        <div key={row.label} className="flex justify-between items-baseline gap-4">
          <span className="text-gray-600 dark:text-gray-400">{row.label}</span>
          {row.href ? <Link {...row} /> : <span className="text-gray-900 dark:text-white text-right">{row.name}</span>}
        </div>
      ))}
    </div>
  );
};

export default Credits;
