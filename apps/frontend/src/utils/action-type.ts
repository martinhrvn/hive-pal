/** `BOX_CONFIGURATION` → `boxConfiguration`, the key under `common:actionTypes`. */
export const actionTypeKey = (type: string) =>
  type.toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
