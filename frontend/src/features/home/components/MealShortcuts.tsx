import type { MealShortcut } from '../types/home.types';
import './MealShortcuts.css';

interface MealShortcutsProps {
  shortcuts: MealShortcut[];
  onSelect?: (id: string) => void;
}

const ICON_PATHS: Record<MealShortcut['icon'], string> = {
  breakfast: 'M6 14h12a4 4 0 0 1 4 4v0H2v0a4 4 0 0 1 4-4zm6-10a4 4 0 0 1 4 4v0H8v0a4 4 0 0 1 4-4z',
  lunch: 'M5 5h14v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V5zm-2 14h18',
  dinner: 'M4 18h16M6 14a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v4H6v-4z',
  snack: 'M12 3l4 4-4 4-4-4 4-4zm0 10l4 4-4 4-4-4 4-4z',
};

export default function MealShortcuts({ shortcuts, onSelect }: MealShortcutsProps) {
  return (
    <section className="home-meal-shortcuts" aria-label="Lựa chọn nhanh theo bữa">
      <div className="home-meal-shortcuts-inner">
        {shortcuts.map((s) => (
          <button
            type="button"
            key={s.id}
            className="home-meal-card"
            onClick={() => onSelect?.(s.id)}
            aria-label={`Lọc theo ${s.label}`}
          >
            <span className="home-meal-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d={ICON_PATHS[s.icon]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="home-meal-label">{s.label}</span>
            <span className="home-meal-desc">{s.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}