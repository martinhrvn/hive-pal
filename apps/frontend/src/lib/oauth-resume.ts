// When an OAuth client (e.g. an MCP client like Claude) asks to connect and the
// user isn't signed in, the backend sends them to /login with the original
// authorization request plus a signature. After any sign-in method the
// browser goes back to the authorize endpoint with that request, which then
// continues to the consent page or straight back to the client.

// Parameters better-auth's OAuth provider adds when signing the request.
const SIGNATURE_PARAMS = ['sig', 'exp', 'ba_iat', 'ba_pl', 'ba_param'];

export function getOAuthResumeUrl(search: string): string | null {
  const params = new URLSearchParams(search);
  if (!params.has('sig') || !params.has('client_id')) return null;
  SIGNATURE_PARAMS.forEach(name => params.delete(name));
  // The user has just signed in, so don't ask the server to log in again.
  const prompt = (params.get('prompt') ?? '')
    .split(' ')
    .filter(value => value && value !== 'login');
  if (prompt.length) params.set('prompt', prompt.join(' '));
  else params.delete('prompt');
  return `/api/auth/oauth2/authorize?${params}`;
}
