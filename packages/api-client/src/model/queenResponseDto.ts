/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */
import type { QueenResponseDtoStatus } from './queenResponseDtoStatus';

export interface QueenResponseDto {
  /** Unique ID of the queen */
  id: string;
  /**
   * ID of the hive this queen belongs to
   * @nullable
   */
  hiveId?: string | null;
  /**
   * Queen marking code
   * @nullable
   */
  marking: string | null;
  /**
   * Queen color marking
   * @nullable
   */
  color: string | null;
  /** Birth year of the queen */
  year: number;
  source?: string;
  status?: QueenResponseDtoStatus;
  installedAt?: string;
  replacedAt?: string;
}
