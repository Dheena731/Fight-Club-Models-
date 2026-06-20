import OpenAI from 'openai';

// OpenAI-compatible adapter. Drives OpenAI, OpenRouter, Groq, xAI (Grok), Together,
// Ollama, and any custom OpenAI-compatible endpoint — the only differences are
// baseURL + apiKey, both supplied per request from the UI. No server-side env fallback.
export async function openaiAdapter(systemPrompt, userMessage, opts = {}) {
  const apiKey = opts.apiKey || 'no-key'; // 'no-key' is fine for keyless local (Ollama)
  if (!opts.apiKey && !opts.baseURL) throw new Error('OpenAI API key required — add it in the app');
  const baseURL = opts.baseURL || undefined;
  const model = opts.model || 'gpt-4o';
  const maxTokens = opts.maxTokens || Number(process.env.MAX_TOKENS_PER_TURN) || 150;
  const start = Date.now();

  const client = new OpenAI({ apiKey, baseURL, defaultHeaders: opts.headers });

  const res = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature: 0.9, // a little spice for comedy
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const latencyMs = Date.now() - start;
  const choice = res.choices?.[0];

  return {
    text: (choice?.message?.content || '').trim(),
    tokensUsed: res.usage?.total_tokens ?? 0,
    latencyMs,
    model,
    finishReason: choice?.finish_reason || 'stop',
  };
}
