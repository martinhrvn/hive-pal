// No 0/O, 1/l/I: the password is often read out or copied by hand.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** A random temporary password from the browser's CSPRNG. */
export function generatePassword(length = 16): string {
  // Largest multiple of the alphabet size that fits in a byte: values above it
  // are rejected so every character is equally likely.
  const limit = 256 - (256 % ALPHABET.length);
  let result = '';
  while (result.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (byte < limit && result.length < length) {
        result += ALPHABET[byte % ALPHABET.length];
      }
    }
  }
  return result;
}
