/**
 * Secure password utilities using the browser's native Web Crypto API (PBKDF2).
 * Passwords are NEVER stored in plain text.
 */

const ITERATIONS = 100000;
const KEY_LENGTH = 256;

/**
 * Hashes a password using PBKDF2 with a random salt.
 * Returns a string in the format "saltHex:hashHex"
 * @param {string} password
 * @returns {Promise<string>}
 */
export const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH
  );

  const toHex = (buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  return `${toHex(salt.buffer)}:${toHex(hashBuffer)}`;
};

/**
 * Verifies a plain-text password against a stored PBKDF2 hash.
 * @param {string} password
 * @param {string} storedHash  format "saltHex:hashHex"
 * @returns {Promise<boolean>}
 */
export const verifyPassword = async (password, storedHash) => {
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map((b) => parseInt(b, 16)));
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      KEY_LENGTH
    );

    const newHashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return newHashHex === hashHex;
  } catch {
    return false;
  }
};

/**
 * Validates password strength.
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export const validatePassword = (password) => {
  if (password.length < 8)
    return { valid: false, message: 'Password must be at least 8 characters.' };
  if (!/[A-Z]/.test(password))
    return { valid: false, message: 'Must contain at least one uppercase letter.' };
  if (!/[a-z]/.test(password))
    return { valid: false, message: 'Must contain at least one lowercase letter.' };
  if (!/[0-9]/.test(password))
    return { valid: false, message: 'Must contain at least one number.' };
  if (!/[^A-Za-z0-9]/.test(password))
    return { valid: false, message: 'Must contain at least one special character.' };
  return { valid: true, message: '' };
};
