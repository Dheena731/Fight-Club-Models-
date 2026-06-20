import Anthropic from '@anthropic-ai/sdk';

// Anthropic adapter. Per the Claude API rules for claude-opus-4-8:
//  - DO NOT send temperature / top_p / top_k / budget_tokens (they 400)
//  - cap output with max_tokens
//  - check stop_reason === "refusal" before reading content
// apiKey always comes from the UI — no server-side env fallback.
function getClient(apiKey) {
  if (!apiKey) throw new Error('Anthropic API key required — add it in the app');
  return new Anthropic({ apiKey });
}

export async function claudeAdapter(systemPrompt, userMessage, opts = {}) {
  const model = opts.model || 'claude-opus-4-8';
  const maxTokens = opts.maxTokens || Number(process.env.MAX_TOKENS_PER_TURN) || 150;
  const start = Date.now();

  const res = await getClient(opts.apiKey).messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const latencyMs = Date.now() - start;

  if (res.stop_reason === 'refusal') {
    return {
      text: '',
      tokensUsed: (res.usage?.input_tokens ?? 0) + (res.usage?.output_tokens ?? 0),
      latencyMs,
      model,
      finishReason: 'refusal',
    };
  }

  const text = res.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  return {
    text,
    tokensUsed: (res.usage?.input_tokens ?? 0) + (res.usage?.output_tokens ?? 0),
    latencyMs,
    model,
    finishReason: res.stop_reason || 'end_turn',
  };
}
