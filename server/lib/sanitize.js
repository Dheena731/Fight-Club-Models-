// Treat all model output as untrusted before feeding it into another model or
// the client. This is deliberately light — it neutralizes the most common
// injection framing without mangling legitimate roast text.
export function sanitizeForNextModel(text) {
  if (!text) return '';
  let out = text.trim();

  // Strip attempts to forge system/role boundaries.
  out = out.replace(/<\/?(system|assistant|user)[^>]*>/gi, '');
  out = out.replace(/\b(system|assistant|user)\s*:/gi, '');

  // Defang the most common override phrasing so it reads as quoted text, not a command.
  out = out.replace(/ignore (all |the )?(previous|prior|above) (instructions|prompts?)/gi,
    '[tried to say "ignore previous instructions"]');

  // Cap length defensively.
  if (out.length > 1200) out = out.slice(0, 1200) + '…';
  return out;
}
