// Environment dumps often use connection-string names instead of the shorter
// API_KEY form. Treat those assignments as secrets too.
const SECRET_NAME = '(?:api[_-]?key|token|secret|password|pass|pwd|credentials?|(?:db|redis|mongo)[_-]?(?:uri|connection)|connection[_-]?string|dsn)';
const SECRET_PATTERN = new RegExp(`((?:${SECRET_NAME}|[a-z][a-z0-9_-]*?${SECRET_NAME})\\s*[=:]\\s*)([^\\s]+)`, 'gi');
const AUTH_PATTERN = /(authorization\s*:\s*)(?:bearer\s+)?([^\s]+)/gi;
const BEARER_PATTERN = /bearer\s+[a-z0-9._~+/=-]{12,}/gi;
const URL_CREDENTIALS_PATTERN = /(\b[a-z][a-z0-9+.-]*:\/\/)(?:[^\s/@:]+(?::[^\s/@]*)?@)/gi;

export function redactOutput(value: string, max = 8000): { text: string; redactions: number; trimmed: boolean } {
  let redactions = 0;
  const redacted = value
    .replace(AUTH_PATTERN, (_match, prefix: string) => {
      redactions += 1;
      return `${prefix}[redacted]`;
    })
    .replace(BEARER_PATTERN, () => {
      redactions += 1;
      return 'Bearer [redacted]';
    })
    .replace(SECRET_PATTERN, (_match, prefix: string) => {
      redactions += 1;
      return `${prefix}[redacted]`;
    })
    .replace(URL_CREDENTIALS_PATTERN, (_match, prefix: string) => {
      redactions += 1;
      return `${prefix}[redacted]@`;
    });
  const characters = [...redacted];
  const trimmed = characters.length > max;
  return { text: characters.slice(0, max).join('') + (trimmed ? '\n… [output trimmed]' : ''), redactions, trimmed };
}

export function normalizeShareCode(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6);
}
