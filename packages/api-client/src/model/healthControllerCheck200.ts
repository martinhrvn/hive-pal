/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */
import type { HealthControllerCheck200Info } from './healthControllerCheck200Info';
import type { HealthControllerCheck200Error } from './healthControllerCheck200Error';
import type { HealthControllerCheck200Details } from './healthControllerCheck200Details';

export type HealthControllerCheck200 = {
  status?: string;
  /** @nullable */
  info?: HealthControllerCheck200Info;
  /** @nullable */
  error?: HealthControllerCheck200Error;
  details?: HealthControllerCheck200Details;
};
