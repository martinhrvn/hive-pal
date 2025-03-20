/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */
import type { HiveStatusEnum } from './hiveStatusEnum';
import type { HiveResponseDtoActiveQueen } from './hiveResponseDtoActiveQueen';

export interface HiveResponseDto {
  /** Unique identifier of the hive */
  id: string;
  /** Name of the hive */
  name: string;
  /** Status of the hive */
  status: HiveStatusEnum;
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
  /**
   * Date when the hive was installed
   * @nullable
   */
  installationDate: string | null;
  /**
   * Date of the most recent inspection
   * @nullable
   */
  lastInspectionDate?: string | null;
  /**
   * The current active queen in the hive
   * @nullable
   */
  activeQueen?: HiveResponseDtoActiveQueen;
}
