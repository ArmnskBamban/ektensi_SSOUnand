/** Redacted logger. */

const SENSITIVE_KEY_PATTERN = /^(password|pass|_?token|access_?token|refresh_?token|cookie|authorization|session|nim|uid|email|latitude|longitude|hasilscan|qr|student_?id|student_?name)$/i;
let debugEnabled = false;

export function setDebugMode(enabled) { debugEnabled = Boolean(enabled); }
export function isDebugMode() { return debugEnabled; }

function redactString(input) {
  let value = input;
  value = value.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL_REDACTED]');
  value = value.replace(/\b\d{8,20}\b/g, '[ID_REDACTED]');
  value = value.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[TOKEN_REDACTED]');
  value = value.replace(/([?&](?:token|access_token|refresh_token|session|key)=)[^&#\s]+/gi, '$1[REDACTED]');
  value = value.replace(/\b-?\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}\b/g, '[COORDINATES_REDACTED]');
  return value.length > 500 ? `${value.slice(0, 240)}…[TRUNCATED]` : value;
}

export function redact(value, depth = 0, seen = new WeakSet()) {
  if (depth > 8) return '[MAX_DEPTH]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value !== 'object') return value;
  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);
  if (value instanceof Error) return { name: value.name, message: redactString(value.message), stack: debugEnabled ? redactString(value.stack || '') : undefined };
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1, seen));
  const output = {};
  for (const [key, child] of Object.entries(value)) output[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : redact(child, depth + 1, seen);
  return output;
}

function log(level, message, data) {
  if (level === 'debug' && !debugEnabled) return;
  const method = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  const safeMessage = redactString(String(message));
  if (data === undefined) method(`[SIAKAD-X][${level.toUpperCase()}]`, safeMessage);
  else method(`[SIAKAD-X][${level.toUpperCase()}]`, safeMessage, redact(data));
}

export const logger = {
  error: (message, data) => log('error', message, data),
  warn: (message, data) => log('warn', message, data),
  info: (message, data) => log('info', message, data),
  debug: (message, data) => log('debug', message, data)
};
export default logger;
