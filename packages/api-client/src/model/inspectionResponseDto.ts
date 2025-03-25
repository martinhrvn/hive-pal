/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */
import type { InspectionMetricsDto } from './inspectionMetricsDto';
import type { InspectionScoreDto } from './inspectionScoreDto';
import type { InspectionStatus } from './inspectionStatus';
import type { ActionDto } from './actionDto';

export interface InspectionResponseDto {
  /** Unique ID of the inspection */
  id: string;
  /** ID of the hive this inspection belongs to */
  hiveId: string;
  /** Date when the inspection was performed */
  date: string;
  /**
   * Temperature during inspection
   * @nullable
   */
  temperature?: number | null;
  /**
   * Weather conditions during inspection
   * @nullable
   */
  weatherConditions?: string | null;
  /**
   * Additional notes about the inspection
   * @nullable
   */
  notes?: string | null;
  observations: InspectionMetricsDto;
  score: InspectionScoreDto;
  /** Current status of the inspection */
  status: InspectionStatus;
  /** Actions performed during the inspection */
  actions: ActionDto[];
}
