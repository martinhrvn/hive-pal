import type { InspectionResponse } from 'shared-schemas';

export const getInspectionDisplayDate = (
  inspection: Pick<InspectionResponse, 'date' | 'isAllDay'>,
): Date => {
  if (!inspection.isAllDay) {
    return new Date(inspection.date);
  }

  const [year, month, day] = String(inspection.date)
    .slice(0, 10)
    .split('-')
    .map(Number);

  return new Date(year, month - 1, day, 12);
};
