/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */
import type { UpdateQueenDtoStatus } from './updateQueenDtoStatus';

export interface UpdateQueenDto {
  /** ID of the hive this queen belongs to */
  hiveId?: string;
  /**
   * Optional marking, usually number or similar
   * @nullable
   */
  marking?: string | null;
  /**
   * Optional color of the queen
   * @nullable
   */
  color?: string | null;
  /** Birth year of the queen */
  year?: number;
  /**
   * Source of the queen (breeder, etc.)
   * @nullable
   */
  source?: string | null;
  /**
   * Current status of the queen
   * @nullable
   */
  status?: UpdateQueenDtoStatus;
  /**
   * Date when the queen was installed
   * @nullable
   */
  installedAt?: string | null;
  /**
   * Date when the queen was replaced
   * @nullable
   */
  replacedAt?: string | null;
}
