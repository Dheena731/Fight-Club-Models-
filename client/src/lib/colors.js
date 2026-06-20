// Fighter color registry — keep in sync with tailwind.config colors.
export const FIGHTER_COLORS = {
  claude: '#D97757',
  gpt:    '#10A37F',
  gemini: '#4285F4',
};

export function fighterColor(id) {
  return FIGHTER_COLORS[id] ?? '#888';
}

// Tailwind text/border classes by fighter id (safe-list friendly).
export const FIGHTER_CLASSES = {
  claude: { text: 'text-claude', border: 'border-claude', bg: 'bg-claude' },
  gpt:    { text: 'text-gpt',    border: 'border-gpt',    bg: 'bg-gpt' },
  gemini: { text: 'text-gemini', border: 'border-gemini', bg: 'bg-gemini' },
};

export function fighterClasses(id) {
  return FIGHTER_CLASSES[id] ?? { text: 'text-white', border: 'border-white', bg: 'bg-white' };
}
