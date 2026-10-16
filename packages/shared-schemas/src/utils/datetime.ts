import { z } from 'zod';

/**
 * ISO 8601 date-time for request input. Accepts a UTC offset
 * (2026-10-23T08:00:00+02:00) as well as Z, since clients working in local
 * time send offsets; zod's default `.datetime()` only accepts Z.
 */
export const isoDateTime = () => z.string().datetime({ offset: true });
