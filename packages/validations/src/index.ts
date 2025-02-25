/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */
import {
  z as zod
} from 'zod'


export const appControllerGetHelloResponse = zod.string()


export const hiveControllerCreateBody = zod.object({
  "id": zod.string().uuid(),
  "name": zod.string(),
  "apiaryId": zod.string().uuid().nullish(),
  "status": zod.enum(['ACTIVE', 'INACTIVE', 'DEAD', 'SOLD', 'UNKNOWN']),
  "notes": zod.string().nullish()
})

export const hiveControllerCreateResponse = zod.object({
  "id": zod.string(),
  "name": zod.string(),
  "apiaryId": zod.string().nullish(),
  "notes": zod.string().nullish(),
  "installationDate": zod.string(),
  "lastInspectionDate": zod.string().datetime().nullish()
})


export const hiveControllerFindAllResponseItem = zod.object({
  "id": zod.string(),
  "name": zod.string(),
  "apiaryId": zod.string().nullish(),
  "notes": zod.string().nullish(),
  "installationDate": zod.string(),
  "lastInspectionDate": zod.string().datetime().nullish()
})
export const hiveControllerFindAllResponse = zod.array(hiveControllerFindAllResponseItem)


export const hiveControllerFindOneParams = zod.object({
  "id": zod.string()
})


export const hiveControllerUpdateParams = zod.object({
  "id": zod.string()
})


export const hiveControllerRemoveParams = zod.object({
  "id": zod.string()
})


