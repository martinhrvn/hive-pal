/**
 * A utility to decode JWT tokens
 */

interface DecodedToken {
  sub: string;
  email: string;
  role: string;
  passwordChangeRequired: boolean;
  iat: number;
  exp: number;
}

/**
 * Decodes a JWT token to access its payload
 * @param token The JWT token to decode
 * @returns The decoded token payload or null if invalid
 */
export function decodeJwt(token: string): DecodedToken | null {
  try {
    // JWT token has three parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // The payload is the second part, base64url encoded
    const payload = parts[1];

    // Base64url decode and parse as JSON
    const decodedPayload = JSON.parse(decodeBase64Url(payload));

    return decodedPayload;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 * @param token The JWT token to check
 * @returns True if token is expired or invalid, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeJwt(token);

  if (!decoded || !decoded.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * Decodes a base64url encoded string
 * @param input The base64url encoded string
 * @returns The decoded string
 */
function decodeBase64Url(input: string): string {
  // Convert base64url to base64
  // Replace '-' with '+' and '_' with '/'
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }

  // Decode base64
  return atob(base64);
}
