/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */
import type { CreateHiveDtoStatus } from './createHiveDtoStatus';

export interface CreateHiveDto {
  id: string;
  name: string;
  /** @nullable */
  apiaryId?: string | null;
  status: CreateHiveDtoStatus;
  /** @nullable */
  notes?: string | null;
}
