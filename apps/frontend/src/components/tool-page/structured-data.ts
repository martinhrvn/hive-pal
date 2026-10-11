/**
 * Builders for the schema.org JSON-LD nodes shared by the public tool pages.
 * Every tool page describes itself as a free `WebApplication` published by
 * Hive Pal and most add a `HowTo`; keeping the boilerplate here means a page
 * only spells out what is specific to it (name, path, description, steps).
 */

export const SITE_URL = 'https://hivepal.app';

const PUBLISHER = {
  '@type': 'Organization',
  name: 'Hive Pal',
  url: SITE_URL,
} as const;

const APPLICATION_CATEGORY = {
  calculator: {
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'Beekeeping Calculator',
  },
  reference: {
    applicationCategory: 'EducationalApplication',
    applicationSubCategory: 'Beekeeping Reference',
  },
} as const;

export type ToolKind = keyof typeof APPLICATION_CATEGORY;

interface WebApplicationInput {
  readonly name: string;
  /** Language-neutral path, e.g. '/tools/syrup-calculator'. */
  readonly path: string;
  readonly description: string;
  readonly kind: ToolKind;
}

/** `WebApplication` node for a free Hive Pal tool page. */
export function buildWebApplicationJsonLd({
  name,
  path,
  description,
  kind,
}: WebApplicationInput) {
  return {
    '@type': 'WebApplication',
    name,
    url: `${SITE_URL}${path}`,
    ...APPLICATION_CATEGORY[kind],
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript',
    description,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: PUBLISHER,
  };
}

export interface HowToStepItem {
  readonly name: string;
  readonly text: string;
}

interface HowToInput {
  readonly name: string;
  readonly description: string;
  readonly steps: readonly HowToStepItem[];
}

/** `HowTo` node whose steps are given as plain name/text pairs. */
export function buildHowToJsonLd({ name, description, steps }: HowToInput) {
  return {
    '@type': 'HowTo',
    name,
    description,
    step: steps.map(step => ({ '@type': 'HowToStep', ...step })),
  };
}

/** Wraps the given nodes in the `@context` / `@graph` envelope. */
export function buildStructuredData(...nodes: readonly object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
