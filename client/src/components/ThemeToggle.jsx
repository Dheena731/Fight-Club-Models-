import { useTheme } from '../lib/theme';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggle}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all duration-200 hover:scale-105 ${className}`}
      style={{
        background: 'var(--c-raised)',
        border: '1px solid var(--c-border)',
        color: 'var(--c-text-2)',
      }}
    >
      {isLight ? '🌙' : '☀️'}
    </button>
  );
}
