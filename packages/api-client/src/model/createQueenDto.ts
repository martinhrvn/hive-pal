/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */
import type { CreateQueenDtoStatus } from './createQueenDtoStatus';

export interface CreateQueenDto {
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
  year: number;
  /** @nullable */
  source?: string | null;
  /** @nullable */
  status?: CreateQueenDtoStatus;
  /** @nullable */
  installedAt?: string | null;
  /** @nullable */
  replacedAt?: string | null;
}
