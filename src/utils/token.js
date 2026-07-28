/**
 * Secure token generation utilities using the browser's native crypto API.
 */

/**
 * Generates a cryptographically secure random hex token.
 * @param {number} byteLength
 * @returns {string}
 */
export const generateToken = (byteLength = 32) => {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Generates a short 6-digit numeric verification code for display.
 * @returns {string}
 */
export const generateVerificationCode = () => {
  const num = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return num.toString().padStart(6, '0');
};
