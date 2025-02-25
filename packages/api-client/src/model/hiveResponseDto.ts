/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */

export interface HiveResponseDto {
  /** Unique identifier of the hive */
  id: string;
  /** Name of the hive */
  name: string;
  /**
   * ID of the apiary this hive belongs to
   * @nullable
   */
  apiaryId?: string | null;
  /**
   * Additional notes about the hive
   * @nullable
   */
  notes?: string | null;
  /** Date when the hive was installed */
  installationDate: string;
  /**
   * Date of the most recent inspection
   * @nullable
   */
  lastInspectionDate?: string | null;
}
