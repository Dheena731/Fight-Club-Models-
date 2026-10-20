// Short, sourced facts are kept separate from the game's original fiction.
// Do not turn these historical records into claims about current model quality.
export const HISTORICAL_RECORDS = [
  {
    id: 'transformer', date: '2017-06-12', title: 'Attention Is All You Need',
    fact: 'The authors introduced the Transformer architecture, using attention mechanisms rather than recurrence or convolution for the sequence tasks studied.',
    sourceTitle: 'Vaswani et al., Attention Is All You Need', sourceUrl: 'https://arxiv.org/abs/1706.03762', checkedAt: '2026-10-18',
    fiction: 'The Observatory calls its pattern-reading instruments “attention lenses.” Those instruments and the archive plot are invented for this game.',
  },
  {
    id: 'few-shot-learning', date: '2020-05-28', title: 'Language Models are Few-Shot Learners',
    fact: 'The GPT-3 paper studied how a language model could perform tasks from instructions and a small number of examples without task-specific gradient updates.',
    sourceTitle: 'Brown et al., Language Models are Few-Shot Learners', sourceUrl: 'https://arxiv.org/abs/2005.14165', checkedAt: '2026-10-18',
    fiction: 'The Research Guild experiments with clues and examples. Its camp, field tools, and quests are invented for this game.',
  },
  {
    id: 'constitutional-ai', date: '2022-12-15', title: 'Constitutional AI',
    fact: 'Anthropic described a training approach that uses written principles and AI feedback to help shape an assistant’s responses.',
    sourceTitle: 'Anthropic, Constitutional AI: Harmlessness from AI Feedback', sourceUrl: 'https://www.anthropic.com/news/constitutional-ai-harmlessness-from-ai-feedback', checkedAt: '2026-10-18',
    fiction: 'The Wardens keep a fictional charter and safeguard relay records. Their decisions and abilities are not a depiction of Anthropic systems.',
  },
];
