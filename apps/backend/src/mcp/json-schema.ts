type Schema = Record<string, unknown>;

const isSchema = (value: unknown): value is Schema =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const isOnlyAnyOf = (schema: Schema): boolean =>
  Array.isArray(schema.anyOf) && Object.keys(schema).length === 1;

/** `{ not: {} }`: zod's undefined branch of `.optional()` inside a union. */
const isNever = (schema: Schema): boolean =>
  isSchema(schema.not) &&
  Object.keys(schema.not).length === 0 &&
  Object.keys(schema).length === 1;

const isNull = (schema: Schema): boolean =>
  schema.type === 'null' && Object.keys(schema).length === 1;

/** Flattens, filters and de-duplicates the branches of an anyOf. */
const simplifyBranches = (branches: Schema[]): Schema[] => {
  const flat = branches.flatMap((branch) =>
    isOnlyAnyOf(branch) ? (branch.anyOf as Schema[]) : [branch],
  );
  const seen = new Set<string>();
  return flat.filter((branch) => {
    const key = JSON.stringify(branch);
    if (isNever(branch) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Rewrites zod-to-json-schema output into the plain shapes MCP clients handle
 * best: `.optional().nullable()` becomes `{ type: ["string", "null"] }`
 * instead of nested anyOf layers with `{ not: {} }` branches. Optional object
 * properties are already expressed through `required`.
 */
export function simplifyJsonSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(simplifyJsonSchema);
  if (!isSchema(node)) return node;

  const result: Schema = {};
  for (const [key, value] of Object.entries(node)) {
    result[key] =
      key === 'properties' && isSchema(value)
        ? Object.fromEntries(
            Object.entries(value).map(([name, prop]) => [
              name,
              simplifyJsonSchema(prop),
            ]),
          )
        : simplifyJsonSchema(value);
  }
  if (!Array.isArray(result.anyOf)) return result;

  const { anyOf, ...rest } = result;
  const branches = simplifyBranches(anyOf as Schema[]);
  if (branches.length === 1) return { ...rest, ...branches[0] };

  const nonNull = branches.filter((branch) => !isNull(branch));
  if (
    branches.length === 2 &&
    nonNull.length === 1 &&
    typeof nonNull[0].type === 'string'
  ) {
    const [value] = nonNull;
    return {
      ...rest,
      ...value,
      type: [value.type, 'null'],
      // An enum restricts the value on its own, so it has to admit null too.
      ...(Array.isArray(value.enum) && { enum: [...value.enum, null] }),
    };
  }
  return { ...rest, anyOf: branches };
}
