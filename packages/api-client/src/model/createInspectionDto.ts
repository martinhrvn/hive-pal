/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */
import type { CreateInspectionObservationsDto } from './createInspectionObservationsDto';

export interface CreateInspectionDto {
  id?: string;
  hiveId: string;
  date: string;
  temperature?: number;
  weatherConditions?: string;
  observations?: CreateInspectionObservationsDto;
}
