const SECRET_NAME = '(?:api[_-]?key|token|secret|password|pass|pwd|credentials?|database(?:[_-]?url)?|(?:db|redis|mongo|postgres|pg)[_-]?url|connection[_-]?string|dsn)';
const SECRET_PATTERN = new RegExp(`((?:${SECRET_NAME}|[a-z][a-z0-9_-]*?${SECRET_NAME})\\s*[=:]\\s*)([^\\s]+)`, 'gi');
const AUTH_PATTERN = /(authorization\s*:\s*)(?:bearer\s+)?([^\s]+)/gi;
const BEARER_PATTERN = /bearer\s+[a-z0-9._~+/=-]{12,}/gi;
const URL_CREDENTIALS_PATTERN = /(\b[a-z][a-z0-9+.-]*:\/\/)(?:[^\s/@:]+(?::[^\s/@]*)?@)/gi;

/** Redact before the extension opens an evidence preview or sends it to the relay. */
export function redactAndCap(value: string, max = 8000): string {
  const redacted = value
    .replace(AUTH_PATTERN, '$1[redacted]')
    .replace(BEARER_PATTERN, 'Bearer [redacted]')
    .replace(SECRET_PATTERN, '$1[redacted]')
    .replace(URL_CREDENTIALS_PATTERN, '$1[redacted]@');
  const characters = [...redacted];
  return characters.slice(0, max).join('') + (characters.length > max ? '\n… [output trimmed]' : '');
}
