/**
 * A utility to decode JWT tokens
 */

import { safeJsonParse } from './safe-json-parse';
import { z } from 'zod';

const jwtPayloadSchema = z.object({
  exp: z.number(),
  iat: z.number(),
  sub: z.string(),
  email: z.string().email(),
  role: z.string().optional(),
  passwordChangeRequired: z.boolean().optional(),
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

/**
 * Decodes a JWT token to access its payload
 * @param token The JWT token to decode
 * @returns The decoded token payload or null if invalid
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    // JWT token has three parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // The payload is the second part, base64url encoded
    const payload = parts[1];

    // Base64url decode and parse as JSON
    const decodedPayload = safeJsonParse(
      decodeBase64Url(payload),
      jwtPayloadSchema,
      'JWT payload'
    );

    if (!decodedPayload) {
      console.error('Failed to decode JWT payload');
      return null;
    }

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
