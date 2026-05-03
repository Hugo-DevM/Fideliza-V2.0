/**
 * Structured JSON logger for API requests and server-side events.
 *
 * In production, logs are written as newline-delimited JSON (NDJSON)
 * compatible with Vercel's log drains, Datadog, Logtail, etc.
 *
 * Log levels: debug < info < warn < error
 * Controlled by LOG_LEVEL env var (default: 'info')
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  tenantId?: string;
  customerId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  ip?: string;
  [key: string]: unknown;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info:  1,
  warn:  2,
  error: 3,
};

function getConfiguredLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL ?? 'info').toLowerCase() as LogLevel;
  return LEVELS[env] !== undefined ? env : 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[getConfiguredLevel()];
}

// ── PII redaction ─────────────────────────────────────────────────────────
// Patterns to redact before writing log lines. Keeps access codes, emails,
// and phone numbers out of log aggregators.

const PII_PATTERNS: Array<{ re: RegExp; replacement: string }> = [
  // Customer access codes: XXXX-XXXX (8 alphanumeric chars split by hyphen)
  { re: /\b[A-Z0-9]{4}-[A-Z0-9]{4}\b/g, replacement: '[CODE]' },
  // Redemption codes: XXXX-XXX-XXX
  { re: /\b[A-Z0-9]{4}-[A-Z0-9]{3}-[A-Z0-9]{3}\b/g, replacement: '[VOUCHER]' },
  // Email addresses
  { re: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  // Phone numbers (E.164 format)
  { re: /\+?[1-9]\d{6,14}/g, replacement: '[PHONE]' },
];

function redactPii(text: string): string {
  let result = text;
  for (const { re, replacement } of PII_PATTERNS) {
    result = result.replace(re, replacement);
  }
  return result;
}

function write(level: LogLevel, message: string, ctx: LogContext = {}): void {
  if (!shouldLog(level)) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...ctx,
  };

  // Redact PII from the entire serialized log line
  const line = redactPii(JSON.stringify(entry));

  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => write('debug', msg, ctx),
  info:  (msg: string, ctx?: LogContext) => write('info', msg, ctx),
  warn:  (msg: string, ctx?: LogContext) => write('warn', msg, ctx),
  error: (msg: string, ctx?: LogContext) => write('error', msg, ctx),
};

/**
 * Generates a short request ID for correlating log lines within a request.
 * Not a UUID — kept short for readability in log output.
 * Example: "r_k3x7p2"
 */
export function generateRequestId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return 'r_' + Array.from(bytes).map((b) => b.toString(36)).join('');
}

/**
 * Returns a performance-aware request logger factory.
 * Call startTimer() at the start of a request, then logRequest() at the end.
 */
export function createRequestLogger(
  requestId: string,
  method: string,
  path: string,
  ip: string,
  tenantId?: string
) {
  const start = Date.now();

  return {
    logRequest(statusCode: number, extra?: LogContext) {
      const durationMs = Date.now() - start;
      const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

      write(level, `${method} ${path} ${statusCode}`, {
        requestId,
        method,
        path,
        statusCode,
        durationMs,
        ip,
        tenantId,
        ...extra,
      });
    },
  };
}
