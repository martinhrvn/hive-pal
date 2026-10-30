#!/usr/bin/env node

/**
 * Align the JSON serialization settings of the Hive Pal Weblate components with
 * the repository's Prettier configuration.
 *
 * Weblate writes locale files with the `i18next` format. Its serializer always
 * expands arrays and uses the configured indentation, so the components must
 * use 2-space indentation, spaces, no key sorting and non-compact separators to
 * match Prettier. Otherwise every push from Weblate reformats the locale files
 * and conflicts with `pnpm format`.
 *
 * Usage:
 *   WEBLATE_TOKEN=<token> pnpm weblate:format
 *   pnpm weblate:format:check
 *
 * The token needs permission to manage components in the project. Read-only
 * checks work without a token because the API is public.
 *
 * Environment variables:
 *   WEBLATE_URL      Base URL (default: https://weblate.hivepal.app)
 *   WEBLATE_PROJECT  Project slug (default: hive-pal)
 *   WEBLATE_TOKEN    API token, required to apply changes
 */

const baseUrl = (
  process.env.WEBLATE_URL ?? 'https://weblate.hivepal.app'
).replace(/\/+$/, '');
const project = process.env.WEBLATE_PROJECT ?? 'hive-pal';
const token = process.env.WEBLATE_TOKEN?.trim();
const checkOnly = process.argv.includes('--check');

const desiredParams = {
  json_indent: 2,
  json_indent_style: 'spaces',
  json_sort_keys: false,
  json_use_compact_separators: false,
};

async function request(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...init.headers,
    },
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail =
      typeof data === 'string' ? data : (data?.detail ?? JSON.stringify(data));
    throw new Error(
      `${init.method ?? 'GET'} ${url} -> ${response.status}: ${detail}`,
    );
  }

  return data;
}

async function listComponents() {
  let url = `${baseUrl}/api/components/?project=${encodeURIComponent(project)}`;
  const components = [];

  while (url) {
    const page = await request(url);
    components.push(...page.results);
    if (!page.next) {
      break;
    }
    // Weblate returns absolute links using its configured base URL, which may
    // be http even when the instance is served over https. Keep every request
    // on the URL we were given (a redirected PATCH would lose its body).
    const next = new URL(page.next, `${baseUrl}/`);
    url = `${baseUrl}${next.pathname}${next.search}`;
  }

  return components;
}

function getMismatches(params) {
  return Object.entries(desiredParams).filter(
    ([key, value]) => params[key] !== value,
  );
}

async function main() {
  const components = await listComponents();
  const jsonComponents = components.filter(
    component => component.file_format_params?.json_indent !== undefined,
  );

  if (jsonComponents.length === 0) {
    throw new Error(`No JSON components found in project "${project}".`);
  }

  let drifted = 0;

  for (const component of jsonComponents) {
    const mismatches = getMismatches(component.file_format_params);

    if (mismatches.length === 0) {
      console.log(`ok       ${component.slug}`);
      continue;
    }

    drifted += 1;
    const details = mismatches
      .map(
        ([key, value]) =>
          `${key}=${JSON.stringify(component.file_format_params[key])} (expected ${JSON.stringify(value)})`,
      )
      .join(', ');

    if (checkOnly) {
      console.log(`drift    ${component.slug}: ${details}`);
      continue;
    }

    if (!token) {
      throw new Error(
        'WEBLATE_TOKEN is required to update components. Set it and run again, or use --check for a read-only report.',
      );
    }

    const file_format_params = {
      ...component.file_format_params,
      ...desiredParams,
    };
    const componentUrl = `${baseUrl}/api/components/${encodeURIComponent(project)}/${encodeURIComponent(component.slug)}/`;
    await request(componentUrl, {
      method: 'PATCH',
      body: JSON.stringify({ file_format_params }),
    });
    console.log(`updated  ${component.slug}: ${details}`);
  }

  console.log(
    `\n${jsonComponents.length} JSON component(s), ${drifted} with drift.`,
  );

  if (checkOnly && drifted > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(`error: ${error.message}`);
  process.exitCode = 1;
});
