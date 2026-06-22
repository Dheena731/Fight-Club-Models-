const DEV_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/;

function configuredOrigins() {
  return [
    process.env.CLIENT_ORIGIN,
    ...(process.env.ALLOWED_ORIGINS || '').split(','),
  ]
    .map((origin) => origin?.trim())
    .filter(Boolean);
}

export function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (DEV_ORIGIN_PATTERN.test(origin)) return true;
  return configuredOrigins().includes(origin);
}

export const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
};
