export const PROMPT_CARDS = {
  jab: {
    id: 'jab',
    name: 'Jab',
    label: 'FAST',
    description: 'One clean sentence. Land it before they see it coming.',
    directive: 'Use exactly one sentence. Prioritize speed, clarity, and one clean punchline.',
    risk: 'safe',
  },
  callback: {
    id: 'callback',
    name: 'Callback',
    label: 'WIT',
    description: 'Turn an earlier line back on your opponent.',
    directive: 'Reference a specific phrase from an earlier exchange and turn it against your opponent. If this is round one, create a callback to their opening line.',
    risk: 'tactical',
  },
  'glass-cannon': {
    id: 'glass-cannon',
    name: 'Glass Cannon',
    label: 'POWER',
    description: 'Damage is amplified in either direction this round.',
    directive: 'Go for a knockout line. Be decisive and do not hedge.',
    damageMultiplier: 1.6,
    risk: 'volatile',
  },
};

export const PROMPT_CARD_LIST = Object.values(PROMPT_CARDS);

export function getPromptCard(id) {
  if (!id) return PROMPT_CARDS.jab;
  const card = PROMPT_CARDS[id];
  if (!card) throw new Error(`Unknown prompt card: ${id}`);
  return card;
}

export function normalizeCardSequence(cards, rounds) {
  const count = Math.max(1, Number(rounds) || 3);
  const source = Array.isArray(cards) ? cards : [];
  return Array.from({ length: count }, (_, index) => getPromptCard(source[index] || 'jab'));
}

export function publicPromptCard(card) {
  const { directive, ...safe } = card;
  return safe;
}
