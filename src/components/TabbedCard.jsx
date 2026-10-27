import { h } from 'preact';
import Card from './Card';
import { IconTile } from '../icons';

// A card whose title band is its navigation: two or more views of one subject
// side by side, each named the way a card names itself - glyph on its tile,
// title, subtitle. The subtitle of a view that is not shown still reads, so it
// can carry what is worth knowing without switching to it ("1 problem").
//
// tabs: [{ id, title, subtitle?, icon, iconTone? }]. With only one there is
// nothing to choose between, and it is an ordinary card.
const TabbedCard = ({ tabs, value, onChange, children, className = '', glass = false }) => (tabs.length === 1 ? (
  <Card title={tabs[0].title} subtitle={tabs[0].subtitle} icon={tabs[0].icon} iconTone={tabs[0].iconTone} className={className} glass={glass}>
    {children}
  </Card>
) : (
  <div className={`panel ${glass ? 'panel-glass' : ''} rounded-2xl overflow-hidden ${className}`}>
    <div
      role="tablist"
      className="grid bg-gray-200/50 dark:bg-gray-900/30"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((t, i) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`relative px-4 py-3 flex items-center gap-3 text-left min-w-0 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
              i > 0 ? 'border-l border-gray-200/80 dark:border-gray-700/70' : ''
            } ${on ? 'bg-white/80 dark:bg-gray-800/80' : 'hover:bg-white/60 dark:hover:bg-white/5'}`}
          >
            {t.icon && <IconTile icon={t.icon} tone={t.iconTone} className={on ? '' : 'opacity-70'} />}
            <span className="min-w-0">
              <span className={`block text-sm font-semibold truncate ${on ? 'text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                {t.title}
              </span>
              {t.subtitle && (
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{t.subtitle}</span>
              )}
            </span>
            {on && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 dark:bg-blue-400" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
    <div className="p-4" role="tabpanel">
      {children}
    </div>
  </div>
));

export default TabbedCard;
