/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */
import type { HealthControllerCheck503Info } from './healthControllerCheck503Info';
import type { HealthControllerCheck503Error } from './healthControllerCheck503Error';
import type { HealthControllerCheck503Details } from './healthControllerCheck503Details';

export type HealthControllerCheck503 = {
  status?: string;
  /** @nullable */
  info?: HealthControllerCheck503Info;
  /** @nullable */
  error?: HealthControllerCheck503Error;
  details?: HealthControllerCheck503Details;
};
