const WARNING_LABEL_KEYS: Record<string, string> = {
  no_brood: 'hive:scoreWarnings.noBrood',
  swarm_preparation: 'hive:scoreWarnings.swarmPreparation',
  supersedure: 'hive:scoreWarnings.supersedure',
};

/** i18n key for a hive score warning code; unknown codes fall back to the code. */
export const warningLabelKey = (code: string) =>
  WARNING_LABEL_KEYS[code] ?? code;
