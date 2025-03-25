/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */

export interface FeedingActionDto {
  /** Type of feed (Sugar Syrup, Honey, Pollen Sub, Candy) */
  feedType: string;
  /** Amount of feed */
  amount: number;
  /** Unit of measurement (liters, quarts, gallons, kg, lb) */
  unit: string;
  /** Concentration of feed (1:1, 2:1, etc.) */
  concentration?: string;
}
