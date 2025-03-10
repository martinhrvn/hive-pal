/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */
import type { BoxDtoType } from './boxDtoType';

export interface BoxDto {
  /** Optional box ID (will be created if not provided) */
  id?: string;
  /**
   * Position of the box from bottom to top (0-based)
   * @minimum 0
   */
  position: number;
  /**
   * Number of frames in this box
   * @minimum 1
   */
  frameCount: number;
  /** Whether there is a queen excluder above this box */
  hasExcluder: boolean;
  /** Type of box */
  type: BoxDtoType;
  /**
   * Maximum number of frames the box can hold
   * @minimum 1
   */
  maxFrameCount?: number;
}
