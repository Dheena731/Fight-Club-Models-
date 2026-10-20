import { GoogleGenerativeAI } from '@google/generative-ai';

// apiKey always comes from the UI — no server-side env fallback.
function getClient(apiKey) {
  if (!apiKey) throw new Error('Google API key required — add it in the app');
  return new GoogleGenerativeAI(apiKey);
}

export async function geminiAdapter(systemPrompt, userMessage, opts = {}) {
  const model = opts.model || 'gemini-3.6-flash';
  const maxTokens = opts.maxTokens || Number(process.env.MAX_TOKENS_PER_TURN) || 150;
  const start = Date.now();

  const genModel = getClient(opts.apiKey).getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: maxTokens },
  });

  const res = await genModel.generateContent(userMessage, { signal: opts.signal });
  const latencyMs = Date.now() - start;
  const usage = res.response?.usageMetadata;

  return {
    text: (res.response?.text() || '').trim(),
    tokensUsed: usage?.totalTokenCount ?? 0,
    latencyMs,
    model,
    finishReason: res.response?.candidates?.[0]?.finishReason || 'STOP',
  };
}
