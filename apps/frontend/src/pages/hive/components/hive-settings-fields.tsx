/**
 * Defaults for a new hive. Seasons are intentionally absent: a hive inherits
 * its apiary's season template (or the built-in default feeding season) until
 * it is customised on the Settings tab.
 */
export const defaultHiveSettings = {
  inspection: {
    frequencyDays: 7,
    calendarEnabled: true,
  },
};
