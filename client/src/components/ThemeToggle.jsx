import { useTheme } from '../lib/theme';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggle}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      className={`h-10 min-w-[68px] rounded-lg px-3 flex items-center justify-center text-xs font-semibold transition-all duration-200 hover:scale-[1.03] ${className}`}
      style={{
        background: 'var(--c-raised)',
        border: '1px solid var(--c-border)',
        color: 'var(--c-text-2)',
      }}
    >
      {isLight ? 'Dark' : 'Light'}
    </button>
  );
}
