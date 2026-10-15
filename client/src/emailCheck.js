// Instant email checks for the browser: syntax, real ending (IANA suffix list) and common typos.
// The server additionally confirms the domain exists, which cannot be done from a browser.
import tlds from './tlds';

const TLDS = new Set(tlds);
const LOCAL_OK = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i;
const LABEL_OK = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

const POPULAR = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'yahoo.in', 'rediffmail.com'];
const KNOWN_TYPOS = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com', 'gmaill.com': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com',
  'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'outlok.com': 'outlook.com', 'outlook.co': 'outlook.com',
};

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

function suggestDomain(domain) {
  if (KNOWN_TYPOS[domain]) return KNOWN_TYPOS[domain];
  return POPULAR.find((p) => p !== domain && distance(domain, p) <= 2) || null;
}

// Returns { ok: true, email } or { ok: false, error, suggestion? }
export function checkEmail(raw) {
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  const bad = (error, suggestion) => ({ ok: false, error, suggestion });

  const at = email.lastIndexOf('@');
  if (!email || email.length > 254 || at < 1 || email.indexOf('@') !== at) return bad('Enter a valid email address');

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const labels = domain.split('.');
  if (local.length > 64 || !LOCAL_OK.test(local)) return bad('Enter a valid email address');
  if (labels.length < 2 || !labels.every((l) => LABEL_OK.test(l))) return bad('Enter a valid email address');

  const near = suggestDomain(domain);
  const suggestion = near ? `${local}@${near}` : undefined;

  const tld = labels[labels.length - 1];
  if (!TLDS.has(tld)) {
    return bad(`".${tld}" is not a real email ending.${suggestion ? ` Did you mean ${suggestion}?` : ''}`, suggestion);
  }
  if (KNOWN_TYPOS[domain]) return bad(`"${domain}" looks like a typo. Did you mean ${suggestion}?`, suggestion);

  return { ok: true, email };
}
