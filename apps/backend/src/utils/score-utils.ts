import {
  ScoreResult,
  ObservationSchemaType,
  calculateScores,
} from 'shared-schemas';

/**
 * Score calculation utility
 *
 * Retrieves stored or calculated inspection scores with fallback behavior.
 * If scores are stored in the database, uses stored values where present,
 * falling back to calculated values for any that are null.
 *
 * @param inspection - The inspection record with potential stored score values
 * @param metrics - The observation schema type containing metrics for score calculation
 * @param parseJsonFn - Function to parse JSON score warnings (returns string[] | null, falls back to calculated warnings if null)
 * @returns ScoreResult with scores and metadata (warnings, confidence)
 */
export function getStoredOrCalculatedScore(
  inspection: Record<string, unknown>,
  metrics: ObservationSchemaType,
  parseJsonFn: (str: string) => string[] | null,
): ScoreResult {
  const calculated = calculateScores(metrics);

  // If scores are stored in DB, use stored values where present,
  // falling back to calculated values for any that are null
  const overallScore = inspection['overallScore'] as number | null | undefined;
  const populationScore = inspection['populationScore'] as
    | number
    | null
    | undefined;
  const storesScore = inspection['storesScore'] as number | null | undefined;
  const queenScore = inspection['queenScore'] as number | null | undefined;
  const scoreWarnings = inspection['scoreWarnings'] as
    | string
    | null
    | undefined;
  const scoreConfidence = inspection['scoreConfidence'] as
    | number
    | null
    | undefined;

  if (
    overallScore != null ||
    populationScore != null ||
    storesScore != null ||
    queenScore != null
  ) {
    // Parse warnings if present, otherwise use calculated warnings
    let warnings = calculated.warnings;
    if (scoreWarnings) {
      const parsedWarnings = parseJsonFn(scoreWarnings);
      if (parsedWarnings && parsedWarnings.length > 0) {
        warnings = parsedWarnings;
      }
    }

    return {
      overallScore: overallScore ?? calculated.overallScore,
      populationScore: populationScore ?? calculated.populationScore,
      storesScore: storesScore ?? calculated.storesScore,
      queenScore: queenScore ?? calculated.queenScore,
      warnings,
      confidence: scoreConfidence ?? calculated.confidence,
    };
  }
  return calculated;
}
