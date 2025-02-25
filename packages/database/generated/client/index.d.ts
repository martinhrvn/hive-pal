
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Apiary
 * 
 */
export type Apiary = $Result.DefaultSelection<Prisma.$ApiaryPayload>
/**
 * Model Hive
 * 
 */
export type Hive = $Result.DefaultSelection<Prisma.$HivePayload>
/**
 * Model Box
 * 
 */
export type Box = $Result.DefaultSelection<Prisma.$BoxPayload>
/**
 * Model Queen
 * 
 */
export type Queen = $Result.DefaultSelection<Prisma.$QueenPayload>
/**
 * Model Inspection
 * 
 */
export type Inspection = $Result.DefaultSelection<Prisma.$InspectionPayload>
/**
 * Model Observation
 * 
 */
export type Observation = $Result.DefaultSelection<Prisma.$ObservationPayload>
/**
 * Model Action
 * 
 */
export type Action = $Result.DefaultSelection<Prisma.$ActionPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const HiveStatus: {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DEAD: 'DEAD',
  SOLD: 'SOLD',
  UNKNOWN: 'UNKNOWN'
};

export type HiveStatus = (typeof HiveStatus)[keyof typeof HiveStatus]


export const QueenStatus: {
  ACTIVE: 'ACTIVE',
  REPLACED: 'REPLACED',
  DEAD: 'DEAD',
  UNKNOWN: 'UNKNOWN'
};

export type QueenStatus = (typeof QueenStatus)[keyof typeof QueenStatus]


export const BoxType: {
  BROOD: 'BROOD',
  HONEY: 'HONEY',
  FEEDER: 'FEEDER'
};

export type BoxType = (typeof BoxType)[keyof typeof BoxType]

}

export type HiveStatus = $Enums.HiveStatus

export const HiveStatus: typeof $Enums.HiveStatus

export type QueenStatus = $Enums.QueenStatus

export const QueenStatus: typeof $Enums.QueenStatus

export type BoxType = $Enums.BoxType

export const BoxType: typeof $Enums.BoxType

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Apiaries
 * const apiaries = await prisma.apiary.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Apiaries
   * const apiaries = await prisma.apiary.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs, $Utils.Call<Prisma.TypeMapCb, {
    extArgs: ExtArgs
  }>, ClientOptions>

      /**
   * `prisma.apiary`: Exposes CRUD operations for the **Apiary** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Apiaries
    * const apiaries = await prisma.apiary.findMany()
    * ```
    */
  get apiary(): Prisma.ApiaryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.hive`: Exposes CRUD operations for the **Hive** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Hives
    * const hives = await prisma.hive.findMany()
    * ```
    */
  get hive(): Prisma.HiveDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.box`: Exposes CRUD operations for the **Box** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Boxes
    * const boxes = await prisma.box.findMany()
    * ```
    */
  get box(): Prisma.BoxDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.queen`: Exposes CRUD operations for the **Queen** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Queens
    * const queens = await prisma.queen.findMany()
    * ```
    */
  get queen(): Prisma.QueenDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.inspection`: Exposes CRUD operations for the **Inspection** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Inspections
    * const inspections = await prisma.inspection.findMany()
    * ```
    */
  get inspection(): Prisma.InspectionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.observation`: Exposes CRUD operations for the **Observation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Observations
    * const observations = await prisma.observation.findMany()
    * ```
    */
  get observation(): Prisma.ObservationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.action`: Exposes CRUD operations for the **Action** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Actions
    * const actions = await prisma.action.findMany()
    * ```
    */
  get action(): Prisma.ActionDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.4.1
   * Query Engine version: a9055b89e58b4b5bfb59600785423b1db3d0e75d
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Apiary: 'Apiary',
    Hive: 'Hive',
    Box: 'Box',
    Queen: 'Queen',
    Inspection: 'Inspection',
    Observation: 'Observation',
    Action: 'Action'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "apiary" | "hive" | "box" | "queen" | "inspection" | "observation" | "action"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Apiary: {
        payload: Prisma.$ApiaryPayload<ExtArgs>
        fields: Prisma.ApiaryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ApiaryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiaryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ApiaryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiaryPayload>
          }
          findFirst: {
            args: Prisma.ApiaryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiaryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ApiaryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiaryPayload>
          }
          findMany: {
            args: Prisma.ApiaryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiaryPayload>[]
          }
          create: {
            args: Prisma.ApiaryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiaryPayload>
          }
          createMany: {
            args: Prisma.ApiaryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ApiaryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiaryPayload>[]
          }
          delete: {
            args: Prisma.ApiaryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiaryPayload>
          }
          update: {
            args: Prisma.ApiaryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiaryPayload>
          }
          deleteMany: {
            args: Prisma.ApiaryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ApiaryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ApiaryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiaryPayload>[]
          }
          upsert: {
            args: Prisma.ApiaryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiaryPayload>
          }
          aggregate: {
            args: Prisma.ApiaryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateApiary>
          }
          groupBy: {
            args: Prisma.ApiaryGroupByArgs<ExtArgs>
            result: $Utils.Optional<ApiaryGroupByOutputType>[]
          }
          count: {
            args: Prisma.ApiaryCountArgs<ExtArgs>
            result: $Utils.Optional<ApiaryCountAggregateOutputType> | number
          }
        }
      }
      Hive: {
        payload: Prisma.$HivePayload<ExtArgs>
        fields: Prisma.HiveFieldRefs
        operations: {
          findUnique: {
            args: Prisma.HiveFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HivePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.HiveFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HivePayload>
          }
          findFirst: {
            args: Prisma.HiveFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HivePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.HiveFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HivePayload>
          }
          findMany: {
            args: Prisma.HiveFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HivePayload>[]
          }
          create: {
            args: Prisma.HiveCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HivePayload>
          }
          createMany: {
            args: Prisma.HiveCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.HiveCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HivePayload>[]
          }
          delete: {
            args: Prisma.HiveDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HivePayload>
          }
          update: {
            args: Prisma.HiveUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HivePayload>
          }
          deleteMany: {
            args: Prisma.HiveDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.HiveUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.HiveUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HivePayload>[]
          }
          upsert: {
            args: Prisma.HiveUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HivePayload>
          }
          aggregate: {
            args: Prisma.HiveAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateHive>
          }
          groupBy: {
            args: Prisma.HiveGroupByArgs<ExtArgs>
            result: $Utils.Optional<HiveGroupByOutputType>[]
          }
          count: {
            args: Prisma.HiveCountArgs<ExtArgs>
            result: $Utils.Optional<HiveCountAggregateOutputType> | number
          }
        }
      }
      Box: {
        payload: Prisma.$BoxPayload<ExtArgs>
        fields: Prisma.BoxFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BoxFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoxPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BoxFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoxPayload>
          }
          findFirst: {
            args: Prisma.BoxFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoxPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BoxFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoxPayload>
          }
          findMany: {
            args: Prisma.BoxFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoxPayload>[]
          }
          create: {
            args: Prisma.BoxCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoxPayload>
          }
          createMany: {
            args: Prisma.BoxCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BoxCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoxPayload>[]
          }
          delete: {
            args: Prisma.BoxDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoxPayload>
          }
          update: {
            args: Prisma.BoxUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoxPayload>
          }
          deleteMany: {
            args: Prisma.BoxDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BoxUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BoxUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoxPayload>[]
          }
          upsert: {
            args: Prisma.BoxUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BoxPayload>
          }
          aggregate: {
            args: Prisma.BoxAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBox>
          }
          groupBy: {
            args: Prisma.BoxGroupByArgs<ExtArgs>
            result: $Utils.Optional<BoxGroupByOutputType>[]
          }
          count: {
            args: Prisma.BoxCountArgs<ExtArgs>
            result: $Utils.Optional<BoxCountAggregateOutputType> | number
          }
        }
      }
      Queen: {
        payload: Prisma.$QueenPayload<ExtArgs>
        fields: Prisma.QueenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QueenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QueenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueenPayload>
          }
          findFirst: {
            args: Prisma.QueenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QueenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueenPayload>
          }
          findMany: {
            args: Prisma.QueenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueenPayload>[]
          }
          create: {
            args: Prisma.QueenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueenPayload>
          }
          createMany: {
            args: Prisma.QueenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QueenCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueenPayload>[]
          }
          delete: {
            args: Prisma.QueenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueenPayload>
          }
          update: {
            args: Prisma.QueenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueenPayload>
          }
          deleteMany: {
            args: Prisma.QueenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QueenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QueenUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueenPayload>[]
          }
          upsert: {
            args: Prisma.QueenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QueenPayload>
          }
          aggregate: {
            args: Prisma.QueenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQueen>
          }
          groupBy: {
            args: Prisma.QueenGroupByArgs<ExtArgs>
            result: $Utils.Optional<QueenGroupByOutputType>[]
          }
          count: {
            args: Prisma.QueenCountArgs<ExtArgs>
            result: $Utils.Optional<QueenCountAggregateOutputType> | number
          }
        }
      }
      Inspection: {
        payload: Prisma.$InspectionPayload<ExtArgs>
        fields: Prisma.InspectionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InspectionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InspectionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectionPayload>
          }
          findFirst: {
            args: Prisma.InspectionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InspectionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectionPayload>
          }
          findMany: {
            args: Prisma.InspectionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectionPayload>[]
          }
          create: {
            args: Prisma.InspectionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectionPayload>
          }
          createMany: {
            args: Prisma.InspectionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InspectionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectionPayload>[]
          }
          delete: {
            args: Prisma.InspectionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectionPayload>
          }
          update: {
            args: Prisma.InspectionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectionPayload>
          }
          deleteMany: {
            args: Prisma.InspectionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InspectionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InspectionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectionPayload>[]
          }
          upsert: {
            args: Prisma.InspectionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectionPayload>
          }
          aggregate: {
            args: Prisma.InspectionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInspection>
          }
          groupBy: {
            args: Prisma.InspectionGroupByArgs<ExtArgs>
            result: $Utils.Optional<InspectionGroupByOutputType>[]
          }
          count: {
            args: Prisma.InspectionCountArgs<ExtArgs>
            result: $Utils.Optional<InspectionCountAggregateOutputType> | number
          }
        }
      }
      Observation: {
        payload: Prisma.$ObservationPayload<ExtArgs>
        fields: Prisma.ObservationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ObservationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ObservationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ObservationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ObservationPayload>
          }
          findFirst: {
            args: Prisma.ObservationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ObservationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ObservationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ObservationPayload>
          }
          findMany: {
            args: Prisma.ObservationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ObservationPayload>[]
          }
          create: {
            args: Prisma.ObservationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ObservationPayload>
          }
          createMany: {
            args: Prisma.ObservationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ObservationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ObservationPayload>[]
          }
          delete: {
            args: Prisma.ObservationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ObservationPayload>
          }
          update: {
            args: Prisma.ObservationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ObservationPayload>
          }
          deleteMany: {
            args: Prisma.ObservationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ObservationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ObservationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ObservationPayload>[]
          }
          upsert: {
            args: Prisma.ObservationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ObservationPayload>
          }
          aggregate: {
            args: Prisma.ObservationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateObservation>
          }
          groupBy: {
            args: Prisma.ObservationGroupByArgs<ExtArgs>
            result: $Utils.Optional<ObservationGroupByOutputType>[]
          }
          count: {
            args: Prisma.ObservationCountArgs<ExtArgs>
            result: $Utils.Optional<ObservationCountAggregateOutputType> | number
          }
        }
      }
      Action: {
        payload: Prisma.$ActionPayload<ExtArgs>
        fields: Prisma.ActionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ActionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ActionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActionPayload>
          }
          findFirst: {
            args: Prisma.ActionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ActionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActionPayload>
          }
          findMany: {
            args: Prisma.ActionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActionPayload>[]
          }
          create: {
            args: Prisma.ActionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActionPayload>
          }
          createMany: {
            args: Prisma.ActionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ActionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActionPayload>[]
          }
          delete: {
            args: Prisma.ActionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActionPayload>
          }
          update: {
            args: Prisma.ActionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActionPayload>
          }
          deleteMany: {
            args: Prisma.ActionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ActionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ActionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActionPayload>[]
          }
          upsert: {
            args: Prisma.ActionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActionPayload>
          }
          aggregate: {
            args: Prisma.ActionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAction>
          }
          groupBy: {
            args: Prisma.ActionGroupByArgs<ExtArgs>
            result: $Utils.Optional<ActionGroupByOutputType>[]
          }
          count: {
            args: Prisma.ActionCountArgs<ExtArgs>
            result: $Utils.Optional<ActionCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    apiary?: ApiaryOmit
    hive?: HiveOmit
    box?: BoxOmit
    queen?: QueenOmit
    inspection?: InspectionOmit
    observation?: ObservationOmit
    action?: ActionOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ApiaryCountOutputType
   */

  export type ApiaryCountOutputType = {
    hives: number
  }

  export type ApiaryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hives?: boolean | ApiaryCountOutputTypeCountHivesArgs
  }

  // Custom InputTypes
  /**
   * ApiaryCountOutputType without action
   */
  export type ApiaryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiaryCountOutputType
     */
    select?: ApiaryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ApiaryCountOutputType without action
   */
  export type ApiaryCountOutputTypeCountHivesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HiveWhereInput
  }


  /**
   * Count Type HiveCountOutputType
   */

  export type HiveCountOutputType = {
    queens: number
    boxes: number
    inspections: number
  }

  export type HiveCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    queens?: boolean | HiveCountOutputTypeCountQueensArgs
    boxes?: boolean | HiveCountOutputTypeCountBoxesArgs
    inspections?: boolean | HiveCountOutputTypeCountInspectionsArgs
  }

  // Custom InputTypes
  /**
   * HiveCountOutputType without action
   */
  export type HiveCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HiveCountOutputType
     */
    select?: HiveCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * HiveCountOutputType without action
   */
  export type HiveCountOutputTypeCountQueensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QueenWhereInput
  }

  /**
   * HiveCountOutputType without action
   */
  export type HiveCountOutputTypeCountBoxesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BoxWhereInput
  }

  /**
   * HiveCountOutputType without action
   */
  export type HiveCountOutputTypeCountInspectionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InspectionWhereInput
  }


  /**
   * Count Type InspectionCountOutputType
   */

  export type InspectionCountOutputType = {
    observations: number
    actions: number
  }

  export type InspectionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    observations?: boolean | InspectionCountOutputTypeCountObservationsArgs
    actions?: boolean | InspectionCountOutputTypeCountActionsArgs
  }

  // Custom InputTypes
  /**
   * InspectionCountOutputType without action
   */
  export type InspectionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InspectionCountOutputType
     */
    select?: InspectionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * InspectionCountOutputType without action
   */
  export type InspectionCountOutputTypeCountObservationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ObservationWhereInput
  }

  /**
   * InspectionCountOutputType without action
   */
  export type InspectionCountOutputTypeCountActionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ActionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Apiary
   */

  export type AggregateApiary = {
    _count: ApiaryCountAggregateOutputType | null
    _avg: ApiaryAvgAggregateOutputType | null
    _sum: ApiarySumAggregateOutputType | null
    _min: ApiaryMinAggregateOutputType | null
    _max: ApiaryMaxAggregateOutputType | null
  }

  export type ApiaryAvgAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type ApiarySumAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type ApiaryMinAggregateOutputType = {
    id: string | null
    name: string | null
    location: string | null
    latitude: number | null
    longitude: number | null
    notes: string | null
  }

  export type ApiaryMaxAggregateOutputType = {
    id: string | null
    name: string | null
    location: string | null
    latitude: number | null
    longitude: number | null
    notes: string | null
  }

  export type ApiaryCountAggregateOutputType = {
    id: number
    name: number
    location: number
    latitude: number
    longitude: number
    notes: number
    _all: number
  }


  export type ApiaryAvgAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type ApiarySumAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type ApiaryMinAggregateInputType = {
    id?: true
    name?: true
    location?: true
    latitude?: true
    longitude?: true
    notes?: true
  }

  export type ApiaryMaxAggregateInputType = {
    id?: true
    name?: true
    location?: true
    latitude?: true
    longitude?: true
    notes?: true
  }

  export type ApiaryCountAggregateInputType = {
    id?: true
    name?: true
    location?: true
    latitude?: true
    longitude?: true
    notes?: true
    _all?: true
  }

  export type ApiaryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Apiary to aggregate.
     */
    where?: ApiaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Apiaries to fetch.
     */
    orderBy?: ApiaryOrderByWithRelationInput | ApiaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ApiaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Apiaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Apiaries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Apiaries
    **/
    _count?: true | ApiaryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ApiaryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ApiarySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ApiaryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ApiaryMaxAggregateInputType
  }

  export type GetApiaryAggregateType<T extends ApiaryAggregateArgs> = {
        [P in keyof T & keyof AggregateApiary]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateApiary[P]>
      : GetScalarType<T[P], AggregateApiary[P]>
  }




  export type ApiaryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ApiaryWhereInput
    orderBy?: ApiaryOrderByWithAggregationInput | ApiaryOrderByWithAggregationInput[]
    by: ApiaryScalarFieldEnum[] | ApiaryScalarFieldEnum
    having?: ApiaryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ApiaryCountAggregateInputType | true
    _avg?: ApiaryAvgAggregateInputType
    _sum?: ApiarySumAggregateInputType
    _min?: ApiaryMinAggregateInputType
    _max?: ApiaryMaxAggregateInputType
  }

  export type ApiaryGroupByOutputType = {
    id: string
    name: string
    location: string | null
    latitude: number | null
    longitude: number | null
    notes: string | null
    _count: ApiaryCountAggregateOutputType | null
    _avg: ApiaryAvgAggregateOutputType | null
    _sum: ApiarySumAggregateOutputType | null
    _min: ApiaryMinAggregateOutputType | null
    _max: ApiaryMaxAggregateOutputType | null
  }

  type GetApiaryGroupByPayload<T extends ApiaryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ApiaryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ApiaryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ApiaryGroupByOutputType[P]>
            : GetScalarType<T[P], ApiaryGroupByOutputType[P]>
        }
      >
    >


  export type ApiarySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    location?: boolean
    latitude?: boolean
    longitude?: boolean
    notes?: boolean
    hives?: boolean | Apiary$hivesArgs<ExtArgs>
    _count?: boolean | ApiaryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["apiary"]>

  export type ApiarySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    location?: boolean
    latitude?: boolean
    longitude?: boolean
    notes?: boolean
  }, ExtArgs["result"]["apiary"]>

  export type ApiarySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    location?: boolean
    latitude?: boolean
    longitude?: boolean
    notes?: boolean
  }, ExtArgs["result"]["apiary"]>

  export type ApiarySelectScalar = {
    id?: boolean
    name?: boolean
    location?: boolean
    latitude?: boolean
    longitude?: boolean
    notes?: boolean
  }

  export type ApiaryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "location" | "latitude" | "longitude" | "notes", ExtArgs["result"]["apiary"]>
  export type ApiaryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hives?: boolean | Apiary$hivesArgs<ExtArgs>
    _count?: boolean | ApiaryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ApiaryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ApiaryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ApiaryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Apiary"
    objects: {
      hives: Prisma.$HivePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      location: string | null
      latitude: number | null
      longitude: number | null
      notes: string | null
    }, ExtArgs["result"]["apiary"]>
    composites: {}
  }

  type ApiaryGetPayload<S extends boolean | null | undefined | ApiaryDefaultArgs> = $Result.GetResult<Prisma.$ApiaryPayload, S>

  type ApiaryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ApiaryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ApiaryCountAggregateInputType | true
    }

  export interface ApiaryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Apiary'], meta: { name: 'Apiary' } }
    /**
     * Find zero or one Apiary that matches the filter.
     * @param {ApiaryFindUniqueArgs} args - Arguments to find a Apiary
     * @example
     * // Get one Apiary
     * const apiary = await prisma.apiary.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ApiaryFindUniqueArgs>(args: SelectSubset<T, ApiaryFindUniqueArgs<ExtArgs>>): Prisma__ApiaryClient<$Result.GetResult<Prisma.$ApiaryPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Apiary that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ApiaryFindUniqueOrThrowArgs} args - Arguments to find a Apiary
     * @example
     * // Get one Apiary
     * const apiary = await prisma.apiary.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ApiaryFindUniqueOrThrowArgs>(args: SelectSubset<T, ApiaryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ApiaryClient<$Result.GetResult<Prisma.$ApiaryPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Apiary that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiaryFindFirstArgs} args - Arguments to find a Apiary
     * @example
     * // Get one Apiary
     * const apiary = await prisma.apiary.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ApiaryFindFirstArgs>(args?: SelectSubset<T, ApiaryFindFirstArgs<ExtArgs>>): Prisma__ApiaryClient<$Result.GetResult<Prisma.$ApiaryPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Apiary that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiaryFindFirstOrThrowArgs} args - Arguments to find a Apiary
     * @example
     * // Get one Apiary
     * const apiary = await prisma.apiary.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ApiaryFindFirstOrThrowArgs>(args?: SelectSubset<T, ApiaryFindFirstOrThrowArgs<ExtArgs>>): Prisma__ApiaryClient<$Result.GetResult<Prisma.$ApiaryPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Apiaries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiaryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Apiaries
     * const apiaries = await prisma.apiary.findMany()
     * 
     * // Get first 10 Apiaries
     * const apiaries = await prisma.apiary.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const apiaryWithIdOnly = await prisma.apiary.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ApiaryFindManyArgs>(args?: SelectSubset<T, ApiaryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ApiaryPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Apiary.
     * @param {ApiaryCreateArgs} args - Arguments to create a Apiary.
     * @example
     * // Create one Apiary
     * const Apiary = await prisma.apiary.create({
     *   data: {
     *     // ... data to create a Apiary
     *   }
     * })
     * 
     */
    create<T extends ApiaryCreateArgs>(args: SelectSubset<T, ApiaryCreateArgs<ExtArgs>>): Prisma__ApiaryClient<$Result.GetResult<Prisma.$ApiaryPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Apiaries.
     * @param {ApiaryCreateManyArgs} args - Arguments to create many Apiaries.
     * @example
     * // Create many Apiaries
     * const apiary = await prisma.apiary.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ApiaryCreateManyArgs>(args?: SelectSubset<T, ApiaryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Apiaries and returns the data saved in the database.
     * @param {ApiaryCreateManyAndReturnArgs} args - Arguments to create many Apiaries.
     * @example
     * // Create many Apiaries
     * const apiary = await prisma.apiary.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Apiaries and only return the `id`
     * const apiaryWithIdOnly = await prisma.apiary.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ApiaryCreateManyAndReturnArgs>(args?: SelectSubset<T, ApiaryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ApiaryPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Apiary.
     * @param {ApiaryDeleteArgs} args - Arguments to delete one Apiary.
     * @example
     * // Delete one Apiary
     * const Apiary = await prisma.apiary.delete({
     *   where: {
     *     // ... filter to delete one Apiary
     *   }
     * })
     * 
     */
    delete<T extends ApiaryDeleteArgs>(args: SelectSubset<T, ApiaryDeleteArgs<ExtArgs>>): Prisma__ApiaryClient<$Result.GetResult<Prisma.$ApiaryPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Apiary.
     * @param {ApiaryUpdateArgs} args - Arguments to update one Apiary.
     * @example
     * // Update one Apiary
     * const apiary = await prisma.apiary.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ApiaryUpdateArgs>(args: SelectSubset<T, ApiaryUpdateArgs<ExtArgs>>): Prisma__ApiaryClient<$Result.GetResult<Prisma.$ApiaryPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Apiaries.
     * @param {ApiaryDeleteManyArgs} args - Arguments to filter Apiaries to delete.
     * @example
     * // Delete a few Apiaries
     * const { count } = await prisma.apiary.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ApiaryDeleteManyArgs>(args?: SelectSubset<T, ApiaryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Apiaries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiaryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Apiaries
     * const apiary = await prisma.apiary.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ApiaryUpdateManyArgs>(args: SelectSubset<T, ApiaryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Apiaries and returns the data updated in the database.
     * @param {ApiaryUpdateManyAndReturnArgs} args - Arguments to update many Apiaries.
     * @example
     * // Update many Apiaries
     * const apiary = await prisma.apiary.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Apiaries and only return the `id`
     * const apiaryWithIdOnly = await prisma.apiary.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ApiaryUpdateManyAndReturnArgs>(args: SelectSubset<T, ApiaryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ApiaryPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Apiary.
     * @param {ApiaryUpsertArgs} args - Arguments to update or create a Apiary.
     * @example
     * // Update or create a Apiary
     * const apiary = await prisma.apiary.upsert({
     *   create: {
     *     // ... data to create a Apiary
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Apiary we want to update
     *   }
     * })
     */
    upsert<T extends ApiaryUpsertArgs>(args: SelectSubset<T, ApiaryUpsertArgs<ExtArgs>>): Prisma__ApiaryClient<$Result.GetResult<Prisma.$ApiaryPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Apiaries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiaryCountArgs} args - Arguments to filter Apiaries to count.
     * @example
     * // Count the number of Apiaries
     * const count = await prisma.apiary.count({
     *   where: {
     *     // ... the filter for the Apiaries we want to count
     *   }
     * })
    **/
    count<T extends ApiaryCountArgs>(
      args?: Subset<T, ApiaryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ApiaryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Apiary.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiaryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ApiaryAggregateArgs>(args: Subset<T, ApiaryAggregateArgs>): Prisma.PrismaPromise<GetApiaryAggregateType<T>>

    /**
     * Group by Apiary.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiaryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ApiaryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ApiaryGroupByArgs['orderBy'] }
        : { orderBy?: ApiaryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ApiaryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetApiaryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Apiary model
   */
  readonly fields: ApiaryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Apiary.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ApiaryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    hives<T extends Apiary$hivesArgs<ExtArgs> = {}>(args?: Subset<T, Apiary$hivesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Apiary model
   */ 
  interface ApiaryFieldRefs {
    readonly id: FieldRef<"Apiary", 'String'>
    readonly name: FieldRef<"Apiary", 'String'>
    readonly location: FieldRef<"Apiary", 'String'>
    readonly latitude: FieldRef<"Apiary", 'Float'>
    readonly longitude: FieldRef<"Apiary", 'Float'>
    readonly notes: FieldRef<"Apiary", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Apiary findUnique
   */
  export type ApiaryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Apiary
     */
    select?: ApiarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Apiary
     */
    omit?: ApiaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApiaryInclude<ExtArgs> | null
    /**
     * Filter, which Apiary to fetch.
     */
    where: ApiaryWhereUniqueInput
  }

  /**
   * Apiary findUniqueOrThrow
   */
  export type ApiaryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Apiary
     */
    select?: ApiarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Apiary
     */
    omit?: ApiaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApiaryInclude<ExtArgs> | null
    /**
     * Filter, which Apiary to fetch.
     */
    where: ApiaryWhereUniqueInput
  }

  /**
   * Apiary findFirst
   */
  export type ApiaryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Apiary
     */
    select?: ApiarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Apiary
     */
    omit?: ApiaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApiaryInclude<ExtArgs> | null
    /**
     * Filter, which Apiary to fetch.
     */
    where?: ApiaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Apiaries to fetch.
     */
    orderBy?: ApiaryOrderByWithRelationInput | ApiaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Apiaries.
     */
    cursor?: ApiaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Apiaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Apiaries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Apiaries.
     */
    distinct?: ApiaryScalarFieldEnum | ApiaryScalarFieldEnum[]
  }

  /**
   * Apiary findFirstOrThrow
   */
  export type ApiaryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Apiary
     */
    select?: ApiarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Apiary
     */
    omit?: ApiaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApiaryInclude<ExtArgs> | null
    /**
     * Filter, which Apiary to fetch.
     */
    where?: ApiaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Apiaries to fetch.
     */
    orderBy?: ApiaryOrderByWithRelationInput | ApiaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Apiaries.
     */
    cursor?: ApiaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Apiaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Apiaries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Apiaries.
     */
    distinct?: ApiaryScalarFieldEnum | ApiaryScalarFieldEnum[]
  }

  /**
   * Apiary findMany
   */
  export type ApiaryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Apiary
     */
    select?: ApiarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Apiary
     */
    omit?: ApiaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApiaryInclude<ExtArgs> | null
    /**
     * Filter, which Apiaries to fetch.
     */
    where?: ApiaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Apiaries to fetch.
     */
    orderBy?: ApiaryOrderByWithRelationInput | ApiaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Apiaries.
     */
    cursor?: ApiaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Apiaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Apiaries.
     */
    skip?: number
    distinct?: ApiaryScalarFieldEnum | ApiaryScalarFieldEnum[]
  }

  /**
   * Apiary create
   */
  export type ApiaryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Apiary
     */
    select?: ApiarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Apiary
     */
    omit?: ApiaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApiaryInclude<ExtArgs> | null
    /**
     * The data needed to create a Apiary.
     */
    data: XOR<ApiaryCreateInput, ApiaryUncheckedCreateInput>
  }

  /**
   * Apiary createMany
   */
  export type ApiaryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Apiaries.
     */
    data: ApiaryCreateManyInput | ApiaryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Apiary createManyAndReturn
   */
  export type ApiaryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Apiary
     */
    select?: ApiarySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Apiary
     */
    omit?: ApiaryOmit<ExtArgs> | null
    /**
     * The data used to create many Apiaries.
     */
    data: ApiaryCreateManyInput | ApiaryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Apiary update
   */
  export type ApiaryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Apiary
     */
    select?: ApiarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Apiary
     */
    omit?: ApiaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApiaryInclude<ExtArgs> | null
    /**
     * The data needed to update a Apiary.
     */
    data: XOR<ApiaryUpdateInput, ApiaryUncheckedUpdateInput>
    /**
     * Choose, which Apiary to update.
     */
    where: ApiaryWhereUniqueInput
  }

  /**
   * Apiary updateMany
   */
  export type ApiaryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Apiaries.
     */
    data: XOR<ApiaryUpdateManyMutationInput, ApiaryUncheckedUpdateManyInput>
    /**
     * Filter which Apiaries to update
     */
    where?: ApiaryWhereInput
    /**
     * Limit how many Apiaries to update.
     */
    limit?: number
  }

  /**
   * Apiary updateManyAndReturn
   */
  export type ApiaryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Apiary
     */
    select?: ApiarySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Apiary
     */
    omit?: ApiaryOmit<ExtArgs> | null
    /**
     * The data used to update Apiaries.
     */
    data: XOR<ApiaryUpdateManyMutationInput, ApiaryUncheckedUpdateManyInput>
    /**
     * Filter which Apiaries to update
     */
    where?: ApiaryWhereInput
    /**
     * Limit how many Apiaries to update.
     */
    limit?: number
  }

  /**
   * Apiary upsert
   */
  export type ApiaryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Apiary
     */
    select?: ApiarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Apiary
     */
    omit?: ApiaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApiaryInclude<ExtArgs> | null
    /**
     * The filter to search for the Apiary to update in case it exists.
     */
    where: ApiaryWhereUniqueInput
    /**
     * In case the Apiary found by the `where` argument doesn't exist, create a new Apiary with this data.
     */
    create: XOR<ApiaryCreateInput, ApiaryUncheckedCreateInput>
    /**
     * In case the Apiary was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ApiaryUpdateInput, ApiaryUncheckedUpdateInput>
  }

  /**
   * Apiary delete
   */
  export type ApiaryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Apiary
     */
    select?: ApiarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Apiary
     */
    omit?: ApiaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApiaryInclude<ExtArgs> | null
    /**
     * Filter which Apiary to delete.
     */
    where: ApiaryWhereUniqueInput
  }

  /**
   * Apiary deleteMany
   */
  export type ApiaryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Apiaries to delete
     */
    where?: ApiaryWhereInput
    /**
     * Limit how many Apiaries to delete.
     */
    limit?: number
  }

  /**
   * Apiary.hives
   */
  export type Apiary$hivesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Hive
     */
    select?: HiveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Hive
     */
    omit?: HiveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HiveInclude<ExtArgs> | null
    where?: HiveWhereInput
    orderBy?: HiveOrderByWithRelationInput | HiveOrderByWithRelationInput[]
    cursor?: HiveWhereUniqueInput
    take?: number
    skip?: number
    distinct?: HiveScalarFieldEnum | HiveScalarFieldEnum[]
  }

  /**
   * Apiary without action
   */
  export type ApiaryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Apiary
     */
    select?: ApiarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Apiary
     */
    omit?: ApiaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApiaryInclude<ExtArgs> | null
  }


  /**
   * Model Hive
   */

  export type AggregateHive = {
    _count: HiveCountAggregateOutputType | null
    _min: HiveMinAggregateOutputType | null
    _max: HiveMaxAggregateOutputType | null
  }

  export type HiveMinAggregateOutputType = {
    id: string | null
    name: string | null
    apiaryId: string | null
    status: $Enums.HiveStatus | null
    installationDate: Date | null
  }

  export type HiveMaxAggregateOutputType = {
    id: string | null
    name: string | null
    apiaryId: string | null
    status: $Enums.HiveStatus | null
    installationDate: Date | null
  }

  export type HiveCountAggregateOutputType = {
    id: number
    name: number
    apiaryId: number
    status: number
    installationDate: number
    _all: number
  }


  export type HiveMinAggregateInputType = {
    id?: true
    name?: true
    apiaryId?: true
    status?: true
    installationDate?: true
  }

  export type HiveMaxAggregateInputType = {
    id?: true
    name?: true
    apiaryId?: true
    status?: true
    installationDate?: true
  }

  export type HiveCountAggregateInputType = {
    id?: true
    name?: true
    apiaryId?: true
    status?: true
    installationDate?: true
    _all?: true
  }

  export type HiveAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Hive to aggregate.
     */
    where?: HiveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Hives to fetch.
     */
    orderBy?: HiveOrderByWithRelationInput | HiveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: HiveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Hives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Hives.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Hives
    **/
    _count?: true | HiveCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: HiveMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: HiveMaxAggregateInputType
  }

  export type GetHiveAggregateType<T extends HiveAggregateArgs> = {
        [P in keyof T & keyof AggregateHive]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateHive[P]>
      : GetScalarType<T[P], AggregateHive[P]>
  }




  export type HiveGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HiveWhereInput
    orderBy?: HiveOrderByWithAggregationInput | HiveOrderByWithAggregationInput[]
    by: HiveScalarFieldEnum[] | HiveScalarFieldEnum
    having?: HiveScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: HiveCountAggregateInputType | true
    _min?: HiveMinAggregateInputType
    _max?: HiveMaxAggregateInputType
  }

  export type HiveGroupByOutputType = {
    id: string
    name: string
    apiaryId: string | null
    status: $Enums.HiveStatus
    installationDate: Date | null
    _count: HiveCountAggregateOutputType | null
    _min: HiveMinAggregateOutputType | null
    _max: HiveMaxAggregateOutputType | null
  }

  type GetHiveGroupByPayload<T extends HiveGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<HiveGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof HiveGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], HiveGroupByOutputType[P]>
            : GetScalarType<T[P], HiveGroupByOutputType[P]>
        }
      >
    >


  export type HiveSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    apiaryId?: boolean
    status?: boolean
    installationDate?: boolean
    apiary?: boolean | Hive$apiaryArgs<ExtArgs>
    queens?: boolean | Hive$queensArgs<ExtArgs>
    boxes?: boolean | Hive$boxesArgs<ExtArgs>
    inspections?: boolean | Hive$inspectionsArgs<ExtArgs>
    _count?: boolean | HiveCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["hive"]>

  export type HiveSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    apiaryId?: boolean
    status?: boolean
    installationDate?: boolean
    apiary?: boolean | Hive$apiaryArgs<ExtArgs>
  }, ExtArgs["result"]["hive"]>

  export type HiveSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    apiaryId?: boolean
    status?: boolean
    installationDate?: boolean
    apiary?: boolean | Hive$apiaryArgs<ExtArgs>
  }, ExtArgs["result"]["hive"]>

  export type HiveSelectScalar = {
    id?: boolean
    name?: boolean
    apiaryId?: boolean
    status?: boolean
    installationDate?: boolean
  }

  export type HiveOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "apiaryId" | "status" | "installationDate", ExtArgs["result"]["hive"]>
  export type HiveInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    apiary?: boolean | Hive$apiaryArgs<ExtArgs>
    queens?: boolean | Hive$queensArgs<ExtArgs>
    boxes?: boolean | Hive$boxesArgs<ExtArgs>
    inspections?: boolean | Hive$inspectionsArgs<ExtArgs>
    _count?: boolean | HiveCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type HiveIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    apiary?: boolean | Hive$apiaryArgs<ExtArgs>
  }
  export type HiveIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    apiary?: boolean | Hive$apiaryArgs<ExtArgs>
  }

  export type $HivePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Hive"
    objects: {
      apiary: Prisma.$ApiaryPayload<ExtArgs> | null
      queens: Prisma.$QueenPayload<ExtArgs>[]
      boxes: Prisma.$BoxPayload<ExtArgs>[]
      inspections: Prisma.$InspectionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      apiaryId: string | null
      status: $Enums.HiveStatus
      installationDate: Date | null
    }, ExtArgs["result"]["hive"]>
    composites: {}
  }

  type HiveGetPayload<S extends boolean | null | undefined | HiveDefaultArgs> = $Result.GetResult<Prisma.$HivePayload, S>

  type HiveCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<HiveFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: HiveCountAggregateInputType | true
    }

  export interface HiveDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Hive'], meta: { name: 'Hive' } }
    /**
     * Find zero or one Hive that matches the filter.
     * @param {HiveFindUniqueArgs} args - Arguments to find a Hive
     * @example
     * // Get one Hive
     * const hive = await prisma.hive.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends HiveFindUniqueArgs>(args: SelectSubset<T, HiveFindUniqueArgs<ExtArgs>>): Prisma__HiveClient<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Hive that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {HiveFindUniqueOrThrowArgs} args - Arguments to find a Hive
     * @example
     * // Get one Hive
     * const hive = await prisma.hive.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends HiveFindUniqueOrThrowArgs>(args: SelectSubset<T, HiveFindUniqueOrThrowArgs<ExtArgs>>): Prisma__HiveClient<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Hive that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HiveFindFirstArgs} args - Arguments to find a Hive
     * @example
     * // Get one Hive
     * const hive = await prisma.hive.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends HiveFindFirstArgs>(args?: SelectSubset<T, HiveFindFirstArgs<ExtArgs>>): Prisma__HiveClient<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Hive that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HiveFindFirstOrThrowArgs} args - Arguments to find a Hive
     * @example
     * // Get one Hive
     * const hive = await prisma.hive.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends HiveFindFirstOrThrowArgs>(args?: SelectSubset<T, HiveFindFirstOrThrowArgs<ExtArgs>>): Prisma__HiveClient<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Hives that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HiveFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Hives
     * const hives = await prisma.hive.findMany()
     * 
     * // Get first 10 Hives
     * const hives = await prisma.hive.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const hiveWithIdOnly = await prisma.hive.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends HiveFindManyArgs>(args?: SelectSubset<T, HiveFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Hive.
     * @param {HiveCreateArgs} args - Arguments to create a Hive.
     * @example
     * // Create one Hive
     * const Hive = await prisma.hive.create({
     *   data: {
     *     // ... data to create a Hive
     *   }
     * })
     * 
     */
    create<T extends HiveCreateArgs>(args: SelectSubset<T, HiveCreateArgs<ExtArgs>>): Prisma__HiveClient<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Hives.
     * @param {HiveCreateManyArgs} args - Arguments to create many Hives.
     * @example
     * // Create many Hives
     * const hive = await prisma.hive.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends HiveCreateManyArgs>(args?: SelectSubset<T, HiveCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Hives and returns the data saved in the database.
     * @param {HiveCreateManyAndReturnArgs} args - Arguments to create many Hives.
     * @example
     * // Create many Hives
     * const hive = await prisma.hive.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Hives and only return the `id`
     * const hiveWithIdOnly = await prisma.hive.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends HiveCreateManyAndReturnArgs>(args?: SelectSubset<T, HiveCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Hive.
     * @param {HiveDeleteArgs} args - Arguments to delete one Hive.
     * @example
     * // Delete one Hive
     * const Hive = await prisma.hive.delete({
     *   where: {
     *     // ... filter to delete one Hive
     *   }
     * })
     * 
     */
    delete<T extends HiveDeleteArgs>(args: SelectSubset<T, HiveDeleteArgs<ExtArgs>>): Prisma__HiveClient<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Hive.
     * @param {HiveUpdateArgs} args - Arguments to update one Hive.
     * @example
     * // Update one Hive
     * const hive = await prisma.hive.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends HiveUpdateArgs>(args: SelectSubset<T, HiveUpdateArgs<ExtArgs>>): Prisma__HiveClient<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Hives.
     * @param {HiveDeleteManyArgs} args - Arguments to filter Hives to delete.
     * @example
     * // Delete a few Hives
     * const { count } = await prisma.hive.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends HiveDeleteManyArgs>(args?: SelectSubset<T, HiveDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Hives.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HiveUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Hives
     * const hive = await prisma.hive.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends HiveUpdateManyArgs>(args: SelectSubset<T, HiveUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Hives and returns the data updated in the database.
     * @param {HiveUpdateManyAndReturnArgs} args - Arguments to update many Hives.
     * @example
     * // Update many Hives
     * const hive = await prisma.hive.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Hives and only return the `id`
     * const hiveWithIdOnly = await prisma.hive.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends HiveUpdateManyAndReturnArgs>(args: SelectSubset<T, HiveUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Hive.
     * @param {HiveUpsertArgs} args - Arguments to update or create a Hive.
     * @example
     * // Update or create a Hive
     * const hive = await prisma.hive.upsert({
     *   create: {
     *     // ... data to create a Hive
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Hive we want to update
     *   }
     * })
     */
    upsert<T extends HiveUpsertArgs>(args: SelectSubset<T, HiveUpsertArgs<ExtArgs>>): Prisma__HiveClient<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Hives.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HiveCountArgs} args - Arguments to filter Hives to count.
     * @example
     * // Count the number of Hives
     * const count = await prisma.hive.count({
     *   where: {
     *     // ... the filter for the Hives we want to count
     *   }
     * })
    **/
    count<T extends HiveCountArgs>(
      args?: Subset<T, HiveCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], HiveCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Hive.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HiveAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends HiveAggregateArgs>(args: Subset<T, HiveAggregateArgs>): Prisma.PrismaPromise<GetHiveAggregateType<T>>

    /**
     * Group by Hive.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HiveGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends HiveGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: HiveGroupByArgs['orderBy'] }
        : { orderBy?: HiveGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, HiveGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetHiveGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Hive model
   */
  readonly fields: HiveFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Hive.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__HiveClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    apiary<T extends Hive$apiaryArgs<ExtArgs> = {}>(args?: Subset<T, Hive$apiaryArgs<ExtArgs>>): Prisma__ApiaryClient<$Result.GetResult<Prisma.$ApiaryPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | null, null, ExtArgs, ClientOptions>
    queens<T extends Hive$queensArgs<ExtArgs> = {}>(args?: Subset<T, Hive$queensArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QueenPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    boxes<T extends Hive$boxesArgs<ExtArgs> = {}>(args?: Subset<T, Hive$boxesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BoxPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    inspections<T extends Hive$inspectionsArgs<ExtArgs> = {}>(args?: Subset<T, Hive$inspectionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Hive model
   */ 
  interface HiveFieldRefs {
    readonly id: FieldRef<"Hive", 'String'>
    readonly name: FieldRef<"Hive", 'String'>
    readonly apiaryId: FieldRef<"Hive", 'String'>
    readonly status: FieldRef<"Hive", 'HiveStatus'>
    readonly installationDate: FieldRef<"Hive", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Hive findUnique
   */
  export type HiveFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Hive
     */
    select?: HiveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Hive
     */
    omit?: HiveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HiveInclude<ExtArgs> | null
    /**
     * Filter, which Hive to fetch.
     */
    where: HiveWhereUniqueInput
  }

  /**
   * Hive findUniqueOrThrow
   */
  export type HiveFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Hive
     */
    select?: HiveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Hive
     */
    omit?: HiveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HiveInclude<ExtArgs> | null
    /**
     * Filter, which Hive to fetch.
     */
    where: HiveWhereUniqueInput
  }

  /**
   * Hive findFirst
   */
  export type HiveFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Hive
     */
    select?: HiveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Hive
     */
    omit?: HiveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HiveInclude<ExtArgs> | null
    /**
     * Filter, which Hive to fetch.
     */
    where?: HiveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Hives to fetch.
     */
    orderBy?: HiveOrderByWithRelationInput | HiveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Hives.
     */
    cursor?: HiveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Hives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Hives.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Hives.
     */
    distinct?: HiveScalarFieldEnum | HiveScalarFieldEnum[]
  }

  /**
   * Hive findFirstOrThrow
   */
  export type HiveFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Hive
     */
    select?: HiveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Hive
     */
    omit?: HiveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HiveInclude<ExtArgs> | null
    /**
     * Filter, which Hive to fetch.
     */
    where?: HiveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Hives to fetch.
     */
    orderBy?: HiveOrderByWithRelationInput | HiveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Hives.
     */
    cursor?: HiveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Hives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Hives.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Hives.
     */
    distinct?: HiveScalarFieldEnum | HiveScalarFieldEnum[]
  }

  /**
   * Hive findMany
   */
  export type HiveFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Hive
     */
    select?: HiveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Hive
     */
    omit?: HiveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HiveInclude<ExtArgs> | null
    /**
     * Filter, which Hives to fetch.
     */
    where?: HiveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Hives to fetch.
     */
    orderBy?: HiveOrderByWithRelationInput | HiveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Hives.
     */
    cursor?: HiveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Hives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Hives.
     */
    skip?: number
    distinct?: HiveScalarFieldEnum | HiveScalarFieldEnum[]
  }

  /**
   * Hive create
   */
  export type HiveCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Hive
     */
    select?: HiveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Hive
     */
    omit?: HiveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HiveInclude<ExtArgs> | null
    /**
     * The data needed to create a Hive.
     */
    data: XOR<HiveCreateInput, HiveUncheckedCreateInput>
  }

  /**
   * Hive createMany
   */
  export type HiveCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Hives.
     */
    data: HiveCreateManyInput | HiveCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Hive createManyAndReturn
   */
  export type HiveCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Hive
     */
    select?: HiveSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Hive
     */
    omit?: HiveOmit<ExtArgs> | null
    /**
     * The data used to create many Hives.
     */
    data: HiveCreateManyInput | HiveCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HiveIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Hive update
   */
  export type HiveUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Hive
     */
    select?: HiveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Hive
     */
    omit?: HiveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HiveInclude<ExtArgs> | null
    /**
     * The data needed to update a Hive.
     */
    data: XOR<HiveUpdateInput, HiveUncheckedUpdateInput>
    /**
     * Choose, which Hive to update.
     */
    where: HiveWhereUniqueInput
  }

  /**
   * Hive updateMany
   */
  export type HiveUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Hives.
     */
    data: XOR<HiveUpdateManyMutationInput, HiveUncheckedUpdateManyInput>
    /**
     * Filter which Hives to update
     */
    where?: HiveWhereInput
    /**
     * Limit how many Hives to update.
     */
    limit?: number
  }

  /**
   * Hive updateManyAndReturn
   */
  export type HiveUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Hive
     */
    select?: HiveSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Hive
     */
    omit?: HiveOmit<ExtArgs> | null
    /**
     * The data used to update Hives.
     */
    data: XOR<HiveUpdateManyMutationInput, HiveUncheckedUpdateManyInput>
    /**
     * Filter which Hives to update
     */
    where?: HiveWhereInput
    /**
     * Limit how many Hives to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HiveIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Hive upsert
   */
  export type HiveUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Hive
     */
    select?: HiveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Hive
     */
    omit?: HiveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HiveInclude<ExtArgs> | null
    /**
     * The filter to search for the Hive to update in case it exists.
     */
    where: HiveWhereUniqueInput
    /**
     * In case the Hive found by the `where` argument doesn't exist, create a new Hive with this data.
     */
    create: XOR<HiveCreateInput, HiveUncheckedCreateInput>
    /**
     * In case the Hive was found with the provided `where` argument, update it with this data.
     */
    update: XOR<HiveUpdateInput, HiveUncheckedUpdateInput>
  }

  /**
   * Hive delete
   */
  export type HiveDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Hive
     */
    select?: HiveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Hive
     */
    omit?: HiveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HiveInclude<ExtArgs> | null
    /**
     * Filter which Hive to delete.
     */
    where: HiveWhereUniqueInput
  }

  /**
   * Hive deleteMany
   */
  export type HiveDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Hives to delete
     */
    where?: HiveWhereInput
    /**
     * Limit how many Hives to delete.
     */
    limit?: number
  }

  /**
   * Hive.apiary
   */
  export type Hive$apiaryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Apiary
     */
    select?: ApiarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Apiary
     */
    omit?: ApiaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ApiaryInclude<ExtArgs> | null
    where?: ApiaryWhereInput
  }

  /**
   * Hive.queens
   */
  export type Hive$queensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Queen
     */
    select?: QueenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Queen
     */
    omit?: QueenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueenInclude<ExtArgs> | null
    where?: QueenWhereInput
    orderBy?: QueenOrderByWithRelationInput | QueenOrderByWithRelationInput[]
    cursor?: QueenWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QueenScalarFieldEnum | QueenScalarFieldEnum[]
  }

  /**
   * Hive.boxes
   */
  export type Hive$boxesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Box
     */
    select?: BoxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Box
     */
    omit?: BoxOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoxInclude<ExtArgs> | null
    where?: BoxWhereInput
    orderBy?: BoxOrderByWithRelationInput | BoxOrderByWithRelationInput[]
    cursor?: BoxWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BoxScalarFieldEnum | BoxScalarFieldEnum[]
  }

  /**
   * Hive.inspections
   */
  export type Hive$inspectionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspection
     */
    select?: InspectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspection
     */
    omit?: InspectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InspectionInclude<ExtArgs> | null
    where?: InspectionWhereInput
    orderBy?: InspectionOrderByWithRelationInput | InspectionOrderByWithRelationInput[]
    cursor?: InspectionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InspectionScalarFieldEnum | InspectionScalarFieldEnum[]
  }

  /**
   * Hive without action
   */
  export type HiveDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Hive
     */
    select?: HiveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Hive
     */
    omit?: HiveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HiveInclude<ExtArgs> | null
  }


  /**
   * Model Box
   */

  export type AggregateBox = {
    _count: BoxCountAggregateOutputType | null
    _avg: BoxAvgAggregateOutputType | null
    _sum: BoxSumAggregateOutputType | null
    _min: BoxMinAggregateOutputType | null
    _max: BoxMaxAggregateOutputType | null
  }

  export type BoxAvgAggregateOutputType = {
    position: number | null
    frameCount: number | null
  }

  export type BoxSumAggregateOutputType = {
    position: number | null
    frameCount: number | null
  }

  export type BoxMinAggregateOutputType = {
    id: string | null
    hiveId: string | null
    position: number | null
    frameCount: number | null
    hasExcluder: boolean | null
    type: $Enums.BoxType | null
  }

  export type BoxMaxAggregateOutputType = {
    id: string | null
    hiveId: string | null
    position: number | null
    frameCount: number | null
    hasExcluder: boolean | null
    type: $Enums.BoxType | null
  }

  export type BoxCountAggregateOutputType = {
    id: number
    hiveId: number
    position: number
    frameCount: number
    hasExcluder: number
    type: number
    _all: number
  }


  export type BoxAvgAggregateInputType = {
    position?: true
    frameCount?: true
  }

  export type BoxSumAggregateInputType = {
    position?: true
    frameCount?: true
  }

  export type BoxMinAggregateInputType = {
    id?: true
    hiveId?: true
    position?: true
    frameCount?: true
    hasExcluder?: true
    type?: true
  }

  export type BoxMaxAggregateInputType = {
    id?: true
    hiveId?: true
    position?: true
    frameCount?: true
    hasExcluder?: true
    type?: true
  }

  export type BoxCountAggregateInputType = {
    id?: true
    hiveId?: true
    position?: true
    frameCount?: true
    hasExcluder?: true
    type?: true
    _all?: true
  }

  export type BoxAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Box to aggregate.
     */
    where?: BoxWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Boxes to fetch.
     */
    orderBy?: BoxOrderByWithRelationInput | BoxOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BoxWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Boxes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Boxes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Boxes
    **/
    _count?: true | BoxCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BoxAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BoxSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BoxMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BoxMaxAggregateInputType
  }

  export type GetBoxAggregateType<T extends BoxAggregateArgs> = {
        [P in keyof T & keyof AggregateBox]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBox[P]>
      : GetScalarType<T[P], AggregateBox[P]>
  }




  export type BoxGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BoxWhereInput
    orderBy?: BoxOrderByWithAggregationInput | BoxOrderByWithAggregationInput[]
    by: BoxScalarFieldEnum[] | BoxScalarFieldEnum
    having?: BoxScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BoxCountAggregateInputType | true
    _avg?: BoxAvgAggregateInputType
    _sum?: BoxSumAggregateInputType
    _min?: BoxMinAggregateInputType
    _max?: BoxMaxAggregateInputType
  }

  export type BoxGroupByOutputType = {
    id: string
    hiveId: string
    position: number
    frameCount: number
    hasExcluder: boolean
    type: $Enums.BoxType
    _count: BoxCountAggregateOutputType | null
    _avg: BoxAvgAggregateOutputType | null
    _sum: BoxSumAggregateOutputType | null
    _min: BoxMinAggregateOutputType | null
    _max: BoxMaxAggregateOutputType | null
  }

  type GetBoxGroupByPayload<T extends BoxGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BoxGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BoxGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BoxGroupByOutputType[P]>
            : GetScalarType<T[P], BoxGroupByOutputType[P]>
        }
      >
    >


  export type BoxSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hiveId?: boolean
    position?: boolean
    frameCount?: boolean
    hasExcluder?: boolean
    type?: boolean
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["box"]>

  export type BoxSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hiveId?: boolean
    position?: boolean
    frameCount?: boolean
    hasExcluder?: boolean
    type?: boolean
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["box"]>

  export type BoxSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hiveId?: boolean
    position?: boolean
    frameCount?: boolean
    hasExcluder?: boolean
    type?: boolean
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["box"]>

  export type BoxSelectScalar = {
    id?: boolean
    hiveId?: boolean
    position?: boolean
    frameCount?: boolean
    hasExcluder?: boolean
    type?: boolean
  }

  export type BoxOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "hiveId" | "position" | "frameCount" | "hasExcluder" | "type", ExtArgs["result"]["box"]>
  export type BoxInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }
  export type BoxIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }
  export type BoxIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }

  export type $BoxPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Box"
    objects: {
      hive: Prisma.$HivePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      hiveId: string
      position: number
      frameCount: number
      hasExcluder: boolean
      type: $Enums.BoxType
    }, ExtArgs["result"]["box"]>
    composites: {}
  }

  type BoxGetPayload<S extends boolean | null | undefined | BoxDefaultArgs> = $Result.GetResult<Prisma.$BoxPayload, S>

  type BoxCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BoxFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BoxCountAggregateInputType | true
    }

  export interface BoxDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Box'], meta: { name: 'Box' } }
    /**
     * Find zero or one Box that matches the filter.
     * @param {BoxFindUniqueArgs} args - Arguments to find a Box
     * @example
     * // Get one Box
     * const box = await prisma.box.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BoxFindUniqueArgs>(args: SelectSubset<T, BoxFindUniqueArgs<ExtArgs>>): Prisma__BoxClient<$Result.GetResult<Prisma.$BoxPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Box that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BoxFindUniqueOrThrowArgs} args - Arguments to find a Box
     * @example
     * // Get one Box
     * const box = await prisma.box.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BoxFindUniqueOrThrowArgs>(args: SelectSubset<T, BoxFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BoxClient<$Result.GetResult<Prisma.$BoxPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Box that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoxFindFirstArgs} args - Arguments to find a Box
     * @example
     * // Get one Box
     * const box = await prisma.box.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BoxFindFirstArgs>(args?: SelectSubset<T, BoxFindFirstArgs<ExtArgs>>): Prisma__BoxClient<$Result.GetResult<Prisma.$BoxPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Box that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoxFindFirstOrThrowArgs} args - Arguments to find a Box
     * @example
     * // Get one Box
     * const box = await prisma.box.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BoxFindFirstOrThrowArgs>(args?: SelectSubset<T, BoxFindFirstOrThrowArgs<ExtArgs>>): Prisma__BoxClient<$Result.GetResult<Prisma.$BoxPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Boxes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoxFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Boxes
     * const boxes = await prisma.box.findMany()
     * 
     * // Get first 10 Boxes
     * const boxes = await prisma.box.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const boxWithIdOnly = await prisma.box.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BoxFindManyArgs>(args?: SelectSubset<T, BoxFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BoxPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Box.
     * @param {BoxCreateArgs} args - Arguments to create a Box.
     * @example
     * // Create one Box
     * const Box = await prisma.box.create({
     *   data: {
     *     // ... data to create a Box
     *   }
     * })
     * 
     */
    create<T extends BoxCreateArgs>(args: SelectSubset<T, BoxCreateArgs<ExtArgs>>): Prisma__BoxClient<$Result.GetResult<Prisma.$BoxPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Boxes.
     * @param {BoxCreateManyArgs} args - Arguments to create many Boxes.
     * @example
     * // Create many Boxes
     * const box = await prisma.box.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BoxCreateManyArgs>(args?: SelectSubset<T, BoxCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Boxes and returns the data saved in the database.
     * @param {BoxCreateManyAndReturnArgs} args - Arguments to create many Boxes.
     * @example
     * // Create many Boxes
     * const box = await prisma.box.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Boxes and only return the `id`
     * const boxWithIdOnly = await prisma.box.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BoxCreateManyAndReturnArgs>(args?: SelectSubset<T, BoxCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BoxPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Box.
     * @param {BoxDeleteArgs} args - Arguments to delete one Box.
     * @example
     * // Delete one Box
     * const Box = await prisma.box.delete({
     *   where: {
     *     // ... filter to delete one Box
     *   }
     * })
     * 
     */
    delete<T extends BoxDeleteArgs>(args: SelectSubset<T, BoxDeleteArgs<ExtArgs>>): Prisma__BoxClient<$Result.GetResult<Prisma.$BoxPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Box.
     * @param {BoxUpdateArgs} args - Arguments to update one Box.
     * @example
     * // Update one Box
     * const box = await prisma.box.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BoxUpdateArgs>(args: SelectSubset<T, BoxUpdateArgs<ExtArgs>>): Prisma__BoxClient<$Result.GetResult<Prisma.$BoxPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Boxes.
     * @param {BoxDeleteManyArgs} args - Arguments to filter Boxes to delete.
     * @example
     * // Delete a few Boxes
     * const { count } = await prisma.box.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BoxDeleteManyArgs>(args?: SelectSubset<T, BoxDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Boxes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoxUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Boxes
     * const box = await prisma.box.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BoxUpdateManyArgs>(args: SelectSubset<T, BoxUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Boxes and returns the data updated in the database.
     * @param {BoxUpdateManyAndReturnArgs} args - Arguments to update many Boxes.
     * @example
     * // Update many Boxes
     * const box = await prisma.box.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Boxes and only return the `id`
     * const boxWithIdOnly = await prisma.box.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BoxUpdateManyAndReturnArgs>(args: SelectSubset<T, BoxUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BoxPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Box.
     * @param {BoxUpsertArgs} args - Arguments to update or create a Box.
     * @example
     * // Update or create a Box
     * const box = await prisma.box.upsert({
     *   create: {
     *     // ... data to create a Box
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Box we want to update
     *   }
     * })
     */
    upsert<T extends BoxUpsertArgs>(args: SelectSubset<T, BoxUpsertArgs<ExtArgs>>): Prisma__BoxClient<$Result.GetResult<Prisma.$BoxPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Boxes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoxCountArgs} args - Arguments to filter Boxes to count.
     * @example
     * // Count the number of Boxes
     * const count = await prisma.box.count({
     *   where: {
     *     // ... the filter for the Boxes we want to count
     *   }
     * })
    **/
    count<T extends BoxCountArgs>(
      args?: Subset<T, BoxCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BoxCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Box.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoxAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BoxAggregateArgs>(args: Subset<T, BoxAggregateArgs>): Prisma.PrismaPromise<GetBoxAggregateType<T>>

    /**
     * Group by Box.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BoxGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BoxGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BoxGroupByArgs['orderBy'] }
        : { orderBy?: BoxGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BoxGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBoxGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Box model
   */
  readonly fields: BoxFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Box.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BoxClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    hive<T extends HiveDefaultArgs<ExtArgs> = {}>(args?: Subset<T, HiveDefaultArgs<ExtArgs>>): Prisma__HiveClient<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Box model
   */ 
  interface BoxFieldRefs {
    readonly id: FieldRef<"Box", 'String'>
    readonly hiveId: FieldRef<"Box", 'String'>
    readonly position: FieldRef<"Box", 'Int'>
    readonly frameCount: FieldRef<"Box", 'Int'>
    readonly hasExcluder: FieldRef<"Box", 'Boolean'>
    readonly type: FieldRef<"Box", 'BoxType'>
  }
    

  // Custom InputTypes
  /**
   * Box findUnique
   */
  export type BoxFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Box
     */
    select?: BoxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Box
     */
    omit?: BoxOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoxInclude<ExtArgs> | null
    /**
     * Filter, which Box to fetch.
     */
    where: BoxWhereUniqueInput
  }

  /**
   * Box findUniqueOrThrow
   */
  export type BoxFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Box
     */
    select?: BoxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Box
     */
    omit?: BoxOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoxInclude<ExtArgs> | null
    /**
     * Filter, which Box to fetch.
     */
    where: BoxWhereUniqueInput
  }

  /**
   * Box findFirst
   */
  export type BoxFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Box
     */
    select?: BoxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Box
     */
    omit?: BoxOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoxInclude<ExtArgs> | null
    /**
     * Filter, which Box to fetch.
     */
    where?: BoxWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Boxes to fetch.
     */
    orderBy?: BoxOrderByWithRelationInput | BoxOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Boxes.
     */
    cursor?: BoxWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Boxes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Boxes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Boxes.
     */
    distinct?: BoxScalarFieldEnum | BoxScalarFieldEnum[]
  }

  /**
   * Box findFirstOrThrow
   */
  export type BoxFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Box
     */
    select?: BoxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Box
     */
    omit?: BoxOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoxInclude<ExtArgs> | null
    /**
     * Filter, which Box to fetch.
     */
    where?: BoxWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Boxes to fetch.
     */
    orderBy?: BoxOrderByWithRelationInput | BoxOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Boxes.
     */
    cursor?: BoxWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Boxes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Boxes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Boxes.
     */
    distinct?: BoxScalarFieldEnum | BoxScalarFieldEnum[]
  }

  /**
   * Box findMany
   */
  export type BoxFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Box
     */
    select?: BoxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Box
     */
    omit?: BoxOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoxInclude<ExtArgs> | null
    /**
     * Filter, which Boxes to fetch.
     */
    where?: BoxWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Boxes to fetch.
     */
    orderBy?: BoxOrderByWithRelationInput | BoxOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Boxes.
     */
    cursor?: BoxWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Boxes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Boxes.
     */
    skip?: number
    distinct?: BoxScalarFieldEnum | BoxScalarFieldEnum[]
  }

  /**
   * Box create
   */
  export type BoxCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Box
     */
    select?: BoxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Box
     */
    omit?: BoxOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoxInclude<ExtArgs> | null
    /**
     * The data needed to create a Box.
     */
    data: XOR<BoxCreateInput, BoxUncheckedCreateInput>
  }

  /**
   * Box createMany
   */
  export type BoxCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Boxes.
     */
    data: BoxCreateManyInput | BoxCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Box createManyAndReturn
   */
  export type BoxCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Box
     */
    select?: BoxSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Box
     */
    omit?: BoxOmit<ExtArgs> | null
    /**
     * The data used to create many Boxes.
     */
    data: BoxCreateManyInput | BoxCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoxIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Box update
   */
  export type BoxUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Box
     */
    select?: BoxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Box
     */
    omit?: BoxOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoxInclude<ExtArgs> | null
    /**
     * The data needed to update a Box.
     */
    data: XOR<BoxUpdateInput, BoxUncheckedUpdateInput>
    /**
     * Choose, which Box to update.
     */
    where: BoxWhereUniqueInput
  }

  /**
   * Box updateMany
   */
  export type BoxUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Boxes.
     */
    data: XOR<BoxUpdateManyMutationInput, BoxUncheckedUpdateManyInput>
    /**
     * Filter which Boxes to update
     */
    where?: BoxWhereInput
    /**
     * Limit how many Boxes to update.
     */
    limit?: number
  }

  /**
   * Box updateManyAndReturn
   */
  export type BoxUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Box
     */
    select?: BoxSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Box
     */
    omit?: BoxOmit<ExtArgs> | null
    /**
     * The data used to update Boxes.
     */
    data: XOR<BoxUpdateManyMutationInput, BoxUncheckedUpdateManyInput>
    /**
     * Filter which Boxes to update
     */
    where?: BoxWhereInput
    /**
     * Limit how many Boxes to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoxIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Box upsert
   */
  export type BoxUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Box
     */
    select?: BoxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Box
     */
    omit?: BoxOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoxInclude<ExtArgs> | null
    /**
     * The filter to search for the Box to update in case it exists.
     */
    where: BoxWhereUniqueInput
    /**
     * In case the Box found by the `where` argument doesn't exist, create a new Box with this data.
     */
    create: XOR<BoxCreateInput, BoxUncheckedCreateInput>
    /**
     * In case the Box was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BoxUpdateInput, BoxUncheckedUpdateInput>
  }

  /**
   * Box delete
   */
  export type BoxDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Box
     */
    select?: BoxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Box
     */
    omit?: BoxOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoxInclude<ExtArgs> | null
    /**
     * Filter which Box to delete.
     */
    where: BoxWhereUniqueInput
  }

  /**
   * Box deleteMany
   */
  export type BoxDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Boxes to delete
     */
    where?: BoxWhereInput
    /**
     * Limit how many Boxes to delete.
     */
    limit?: number
  }

  /**
   * Box without action
   */
  export type BoxDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Box
     */
    select?: BoxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Box
     */
    omit?: BoxOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BoxInclude<ExtArgs> | null
  }


  /**
   * Model Queen
   */

  export type AggregateQueen = {
    _count: QueenCountAggregateOutputType | null
    _avg: QueenAvgAggregateOutputType | null
    _sum: QueenSumAggregateOutputType | null
    _min: QueenMinAggregateOutputType | null
    _max: QueenMaxAggregateOutputType | null
  }

  export type QueenAvgAggregateOutputType = {
    year: number | null
  }

  export type QueenSumAggregateOutputType = {
    year: number | null
  }

  export type QueenMinAggregateOutputType = {
    id: string | null
    hiveId: string | null
    markingColor: string | null
    year: number | null
    source: string | null
    status: $Enums.QueenStatus | null
    installedAt: Date | null
    replacedAt: Date | null
  }

  export type QueenMaxAggregateOutputType = {
    id: string | null
    hiveId: string | null
    markingColor: string | null
    year: number | null
    source: string | null
    status: $Enums.QueenStatus | null
    installedAt: Date | null
    replacedAt: Date | null
  }

  export type QueenCountAggregateOutputType = {
    id: number
    hiveId: number
    markingColor: number
    year: number
    source: number
    status: number
    installedAt: number
    replacedAt: number
    _all: number
  }


  export type QueenAvgAggregateInputType = {
    year?: true
  }

  export type QueenSumAggregateInputType = {
    year?: true
  }

  export type QueenMinAggregateInputType = {
    id?: true
    hiveId?: true
    markingColor?: true
    year?: true
    source?: true
    status?: true
    installedAt?: true
    replacedAt?: true
  }

  export type QueenMaxAggregateInputType = {
    id?: true
    hiveId?: true
    markingColor?: true
    year?: true
    source?: true
    status?: true
    installedAt?: true
    replacedAt?: true
  }

  export type QueenCountAggregateInputType = {
    id?: true
    hiveId?: true
    markingColor?: true
    year?: true
    source?: true
    status?: true
    installedAt?: true
    replacedAt?: true
    _all?: true
  }

  export type QueenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Queen to aggregate.
     */
    where?: QueenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Queens to fetch.
     */
    orderBy?: QueenOrderByWithRelationInput | QueenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QueenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Queens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Queens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Queens
    **/
    _count?: true | QueenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QueenAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QueenSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QueenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QueenMaxAggregateInputType
  }

  export type GetQueenAggregateType<T extends QueenAggregateArgs> = {
        [P in keyof T & keyof AggregateQueen]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQueen[P]>
      : GetScalarType<T[P], AggregateQueen[P]>
  }




  export type QueenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QueenWhereInput
    orderBy?: QueenOrderByWithAggregationInput | QueenOrderByWithAggregationInput[]
    by: QueenScalarFieldEnum[] | QueenScalarFieldEnum
    having?: QueenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QueenCountAggregateInputType | true
    _avg?: QueenAvgAggregateInputType
    _sum?: QueenSumAggregateInputType
    _min?: QueenMinAggregateInputType
    _max?: QueenMaxAggregateInputType
  }

  export type QueenGroupByOutputType = {
    id: string
    hiveId: string
    markingColor: string | null
    year: number | null
    source: string | null
    status: $Enums.QueenStatus
    installedAt: Date
    replacedAt: Date | null
    _count: QueenCountAggregateOutputType | null
    _avg: QueenAvgAggregateOutputType | null
    _sum: QueenSumAggregateOutputType | null
    _min: QueenMinAggregateOutputType | null
    _max: QueenMaxAggregateOutputType | null
  }

  type GetQueenGroupByPayload<T extends QueenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QueenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QueenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QueenGroupByOutputType[P]>
            : GetScalarType<T[P], QueenGroupByOutputType[P]>
        }
      >
    >


  export type QueenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hiveId?: boolean
    markingColor?: boolean
    year?: boolean
    source?: boolean
    status?: boolean
    installedAt?: boolean
    replacedAt?: boolean
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["queen"]>

  export type QueenSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hiveId?: boolean
    markingColor?: boolean
    year?: boolean
    source?: boolean
    status?: boolean
    installedAt?: boolean
    replacedAt?: boolean
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["queen"]>

  export type QueenSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hiveId?: boolean
    markingColor?: boolean
    year?: boolean
    source?: boolean
    status?: boolean
    installedAt?: boolean
    replacedAt?: boolean
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["queen"]>

  export type QueenSelectScalar = {
    id?: boolean
    hiveId?: boolean
    markingColor?: boolean
    year?: boolean
    source?: boolean
    status?: boolean
    installedAt?: boolean
    replacedAt?: boolean
  }

  export type QueenOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "hiveId" | "markingColor" | "year" | "source" | "status" | "installedAt" | "replacedAt", ExtArgs["result"]["queen"]>
  export type QueenInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }
  export type QueenIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }
  export type QueenIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }

  export type $QueenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Queen"
    objects: {
      hive: Prisma.$HivePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      hiveId: string
      markingColor: string | null
      year: number | null
      source: string | null
      status: $Enums.QueenStatus
      installedAt: Date
      replacedAt: Date | null
    }, ExtArgs["result"]["queen"]>
    composites: {}
  }

  type QueenGetPayload<S extends boolean | null | undefined | QueenDefaultArgs> = $Result.GetResult<Prisma.$QueenPayload, S>

  type QueenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QueenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QueenCountAggregateInputType | true
    }

  export interface QueenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Queen'], meta: { name: 'Queen' } }
    /**
     * Find zero or one Queen that matches the filter.
     * @param {QueenFindUniqueArgs} args - Arguments to find a Queen
     * @example
     * // Get one Queen
     * const queen = await prisma.queen.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QueenFindUniqueArgs>(args: SelectSubset<T, QueenFindUniqueArgs<ExtArgs>>): Prisma__QueenClient<$Result.GetResult<Prisma.$QueenPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Queen that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QueenFindUniqueOrThrowArgs} args - Arguments to find a Queen
     * @example
     * // Get one Queen
     * const queen = await prisma.queen.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QueenFindUniqueOrThrowArgs>(args: SelectSubset<T, QueenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QueenClient<$Result.GetResult<Prisma.$QueenPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Queen that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueenFindFirstArgs} args - Arguments to find a Queen
     * @example
     * // Get one Queen
     * const queen = await prisma.queen.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QueenFindFirstArgs>(args?: SelectSubset<T, QueenFindFirstArgs<ExtArgs>>): Prisma__QueenClient<$Result.GetResult<Prisma.$QueenPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Queen that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueenFindFirstOrThrowArgs} args - Arguments to find a Queen
     * @example
     * // Get one Queen
     * const queen = await prisma.queen.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QueenFindFirstOrThrowArgs>(args?: SelectSubset<T, QueenFindFirstOrThrowArgs<ExtArgs>>): Prisma__QueenClient<$Result.GetResult<Prisma.$QueenPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Queens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Queens
     * const queens = await prisma.queen.findMany()
     * 
     * // Get first 10 Queens
     * const queens = await prisma.queen.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const queenWithIdOnly = await prisma.queen.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QueenFindManyArgs>(args?: SelectSubset<T, QueenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QueenPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Queen.
     * @param {QueenCreateArgs} args - Arguments to create a Queen.
     * @example
     * // Create one Queen
     * const Queen = await prisma.queen.create({
     *   data: {
     *     // ... data to create a Queen
     *   }
     * })
     * 
     */
    create<T extends QueenCreateArgs>(args: SelectSubset<T, QueenCreateArgs<ExtArgs>>): Prisma__QueenClient<$Result.GetResult<Prisma.$QueenPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Queens.
     * @param {QueenCreateManyArgs} args - Arguments to create many Queens.
     * @example
     * // Create many Queens
     * const queen = await prisma.queen.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QueenCreateManyArgs>(args?: SelectSubset<T, QueenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Queens and returns the data saved in the database.
     * @param {QueenCreateManyAndReturnArgs} args - Arguments to create many Queens.
     * @example
     * // Create many Queens
     * const queen = await prisma.queen.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Queens and only return the `id`
     * const queenWithIdOnly = await prisma.queen.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QueenCreateManyAndReturnArgs>(args?: SelectSubset<T, QueenCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QueenPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Queen.
     * @param {QueenDeleteArgs} args - Arguments to delete one Queen.
     * @example
     * // Delete one Queen
     * const Queen = await prisma.queen.delete({
     *   where: {
     *     // ... filter to delete one Queen
     *   }
     * })
     * 
     */
    delete<T extends QueenDeleteArgs>(args: SelectSubset<T, QueenDeleteArgs<ExtArgs>>): Prisma__QueenClient<$Result.GetResult<Prisma.$QueenPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Queen.
     * @param {QueenUpdateArgs} args - Arguments to update one Queen.
     * @example
     * // Update one Queen
     * const queen = await prisma.queen.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QueenUpdateArgs>(args: SelectSubset<T, QueenUpdateArgs<ExtArgs>>): Prisma__QueenClient<$Result.GetResult<Prisma.$QueenPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Queens.
     * @param {QueenDeleteManyArgs} args - Arguments to filter Queens to delete.
     * @example
     * // Delete a few Queens
     * const { count } = await prisma.queen.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QueenDeleteManyArgs>(args?: SelectSubset<T, QueenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Queens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Queens
     * const queen = await prisma.queen.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QueenUpdateManyArgs>(args: SelectSubset<T, QueenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Queens and returns the data updated in the database.
     * @param {QueenUpdateManyAndReturnArgs} args - Arguments to update many Queens.
     * @example
     * // Update many Queens
     * const queen = await prisma.queen.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Queens and only return the `id`
     * const queenWithIdOnly = await prisma.queen.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends QueenUpdateManyAndReturnArgs>(args: SelectSubset<T, QueenUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QueenPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Queen.
     * @param {QueenUpsertArgs} args - Arguments to update or create a Queen.
     * @example
     * // Update or create a Queen
     * const queen = await prisma.queen.upsert({
     *   create: {
     *     // ... data to create a Queen
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Queen we want to update
     *   }
     * })
     */
    upsert<T extends QueenUpsertArgs>(args: SelectSubset<T, QueenUpsertArgs<ExtArgs>>): Prisma__QueenClient<$Result.GetResult<Prisma.$QueenPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Queens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueenCountArgs} args - Arguments to filter Queens to count.
     * @example
     * // Count the number of Queens
     * const count = await prisma.queen.count({
     *   where: {
     *     // ... the filter for the Queens we want to count
     *   }
     * })
    **/
    count<T extends QueenCountArgs>(
      args?: Subset<T, QueenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QueenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Queen.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QueenAggregateArgs>(args: Subset<T, QueenAggregateArgs>): Prisma.PrismaPromise<GetQueenAggregateType<T>>

    /**
     * Group by Queen.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueenGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QueenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QueenGroupByArgs['orderBy'] }
        : { orderBy?: QueenGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QueenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQueenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Queen model
   */
  readonly fields: QueenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Queen.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QueenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    hive<T extends HiveDefaultArgs<ExtArgs> = {}>(args?: Subset<T, HiveDefaultArgs<ExtArgs>>): Prisma__HiveClient<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Queen model
   */ 
  interface QueenFieldRefs {
    readonly id: FieldRef<"Queen", 'String'>
    readonly hiveId: FieldRef<"Queen", 'String'>
    readonly markingColor: FieldRef<"Queen", 'String'>
    readonly year: FieldRef<"Queen", 'Int'>
    readonly source: FieldRef<"Queen", 'String'>
    readonly status: FieldRef<"Queen", 'QueenStatus'>
    readonly installedAt: FieldRef<"Queen", 'DateTime'>
    readonly replacedAt: FieldRef<"Queen", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Queen findUnique
   */
  export type QueenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Queen
     */
    select?: QueenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Queen
     */
    omit?: QueenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueenInclude<ExtArgs> | null
    /**
     * Filter, which Queen to fetch.
     */
    where: QueenWhereUniqueInput
  }

  /**
   * Queen findUniqueOrThrow
   */
  export type QueenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Queen
     */
    select?: QueenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Queen
     */
    omit?: QueenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueenInclude<ExtArgs> | null
    /**
     * Filter, which Queen to fetch.
     */
    where: QueenWhereUniqueInput
  }

  /**
   * Queen findFirst
   */
  export type QueenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Queen
     */
    select?: QueenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Queen
     */
    omit?: QueenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueenInclude<ExtArgs> | null
    /**
     * Filter, which Queen to fetch.
     */
    where?: QueenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Queens to fetch.
     */
    orderBy?: QueenOrderByWithRelationInput | QueenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Queens.
     */
    cursor?: QueenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Queens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Queens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Queens.
     */
    distinct?: QueenScalarFieldEnum | QueenScalarFieldEnum[]
  }

  /**
   * Queen findFirstOrThrow
   */
  export type QueenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Queen
     */
    select?: QueenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Queen
     */
    omit?: QueenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueenInclude<ExtArgs> | null
    /**
     * Filter, which Queen to fetch.
     */
    where?: QueenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Queens to fetch.
     */
    orderBy?: QueenOrderByWithRelationInput | QueenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Queens.
     */
    cursor?: QueenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Queens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Queens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Queens.
     */
    distinct?: QueenScalarFieldEnum | QueenScalarFieldEnum[]
  }

  /**
   * Queen findMany
   */
  export type QueenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Queen
     */
    select?: QueenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Queen
     */
    omit?: QueenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueenInclude<ExtArgs> | null
    /**
     * Filter, which Queens to fetch.
     */
    where?: QueenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Queens to fetch.
     */
    orderBy?: QueenOrderByWithRelationInput | QueenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Queens.
     */
    cursor?: QueenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Queens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Queens.
     */
    skip?: number
    distinct?: QueenScalarFieldEnum | QueenScalarFieldEnum[]
  }

  /**
   * Queen create
   */
  export type QueenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Queen
     */
    select?: QueenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Queen
     */
    omit?: QueenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueenInclude<ExtArgs> | null
    /**
     * The data needed to create a Queen.
     */
    data: XOR<QueenCreateInput, QueenUncheckedCreateInput>
  }

  /**
   * Queen createMany
   */
  export type QueenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Queens.
     */
    data: QueenCreateManyInput | QueenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Queen createManyAndReturn
   */
  export type QueenCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Queen
     */
    select?: QueenSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Queen
     */
    omit?: QueenOmit<ExtArgs> | null
    /**
     * The data used to create many Queens.
     */
    data: QueenCreateManyInput | QueenCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueenIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Queen update
   */
  export type QueenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Queen
     */
    select?: QueenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Queen
     */
    omit?: QueenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueenInclude<ExtArgs> | null
    /**
     * The data needed to update a Queen.
     */
    data: XOR<QueenUpdateInput, QueenUncheckedUpdateInput>
    /**
     * Choose, which Queen to update.
     */
    where: QueenWhereUniqueInput
  }

  /**
   * Queen updateMany
   */
  export type QueenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Queens.
     */
    data: XOR<QueenUpdateManyMutationInput, QueenUncheckedUpdateManyInput>
    /**
     * Filter which Queens to update
     */
    where?: QueenWhereInput
    /**
     * Limit how many Queens to update.
     */
    limit?: number
  }

  /**
   * Queen updateManyAndReturn
   */
  export type QueenUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Queen
     */
    select?: QueenSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Queen
     */
    omit?: QueenOmit<ExtArgs> | null
    /**
     * The data used to update Queens.
     */
    data: XOR<QueenUpdateManyMutationInput, QueenUncheckedUpdateManyInput>
    /**
     * Filter which Queens to update
     */
    where?: QueenWhereInput
    /**
     * Limit how many Queens to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueenIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Queen upsert
   */
  export type QueenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Queen
     */
    select?: QueenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Queen
     */
    omit?: QueenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueenInclude<ExtArgs> | null
    /**
     * The filter to search for the Queen to update in case it exists.
     */
    where: QueenWhereUniqueInput
    /**
     * In case the Queen found by the `where` argument doesn't exist, create a new Queen with this data.
     */
    create: XOR<QueenCreateInput, QueenUncheckedCreateInput>
    /**
     * In case the Queen was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QueenUpdateInput, QueenUncheckedUpdateInput>
  }

  /**
   * Queen delete
   */
  export type QueenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Queen
     */
    select?: QueenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Queen
     */
    omit?: QueenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueenInclude<ExtArgs> | null
    /**
     * Filter which Queen to delete.
     */
    where: QueenWhereUniqueInput
  }

  /**
   * Queen deleteMany
   */
  export type QueenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Queens to delete
     */
    where?: QueenWhereInput
    /**
     * Limit how many Queens to delete.
     */
    limit?: number
  }

  /**
   * Queen without action
   */
  export type QueenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Queen
     */
    select?: QueenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Queen
     */
    omit?: QueenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueenInclude<ExtArgs> | null
  }


  /**
   * Model Inspection
   */

  export type AggregateInspection = {
    _count: InspectionCountAggregateOutputType | null
    _min: InspectionMinAggregateOutputType | null
    _max: InspectionMaxAggregateOutputType | null
  }

  export type InspectionMinAggregateOutputType = {
    id: string | null
    hiveId: string | null
    date: Date | null
    weatherConditions: string | null
  }

  export type InspectionMaxAggregateOutputType = {
    id: string | null
    hiveId: string | null
    date: Date | null
    weatherConditions: string | null
  }

  export type InspectionCountAggregateOutputType = {
    id: number
    hiveId: number
    date: number
    weatherConditions: number
    _all: number
  }


  export type InspectionMinAggregateInputType = {
    id?: true
    hiveId?: true
    date?: true
    weatherConditions?: true
  }

  export type InspectionMaxAggregateInputType = {
    id?: true
    hiveId?: true
    date?: true
    weatherConditions?: true
  }

  export type InspectionCountAggregateInputType = {
    id?: true
    hiveId?: true
    date?: true
    weatherConditions?: true
    _all?: true
  }

  export type InspectionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Inspection to aggregate.
     */
    where?: InspectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inspections to fetch.
     */
    orderBy?: InspectionOrderByWithRelationInput | InspectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InspectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inspections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inspections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Inspections
    **/
    _count?: true | InspectionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InspectionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InspectionMaxAggregateInputType
  }

  export type GetInspectionAggregateType<T extends InspectionAggregateArgs> = {
        [P in keyof T & keyof AggregateInspection]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInspection[P]>
      : GetScalarType<T[P], AggregateInspection[P]>
  }




  export type InspectionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InspectionWhereInput
    orderBy?: InspectionOrderByWithAggregationInput | InspectionOrderByWithAggregationInput[]
    by: InspectionScalarFieldEnum[] | InspectionScalarFieldEnum
    having?: InspectionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InspectionCountAggregateInputType | true
    _min?: InspectionMinAggregateInputType
    _max?: InspectionMaxAggregateInputType
  }

  export type InspectionGroupByOutputType = {
    id: string
    hiveId: string
    date: Date
    weatherConditions: string | null
    _count: InspectionCountAggregateOutputType | null
    _min: InspectionMinAggregateOutputType | null
    _max: InspectionMaxAggregateOutputType | null
  }

  type GetInspectionGroupByPayload<T extends InspectionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InspectionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InspectionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InspectionGroupByOutputType[P]>
            : GetScalarType<T[P], InspectionGroupByOutputType[P]>
        }
      >
    >


  export type InspectionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hiveId?: boolean
    date?: boolean
    weatherConditions?: boolean
    hive?: boolean | HiveDefaultArgs<ExtArgs>
    observations?: boolean | Inspection$observationsArgs<ExtArgs>
    actions?: boolean | Inspection$actionsArgs<ExtArgs>
    _count?: boolean | InspectionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inspection"]>

  export type InspectionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hiveId?: boolean
    date?: boolean
    weatherConditions?: boolean
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inspection"]>

  export type InspectionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hiveId?: boolean
    date?: boolean
    weatherConditions?: boolean
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inspection"]>

  export type InspectionSelectScalar = {
    id?: boolean
    hiveId?: boolean
    date?: boolean
    weatherConditions?: boolean
  }

  export type InspectionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "hiveId" | "date" | "weatherConditions", ExtArgs["result"]["inspection"]>
  export type InspectionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hive?: boolean | HiveDefaultArgs<ExtArgs>
    observations?: boolean | Inspection$observationsArgs<ExtArgs>
    actions?: boolean | Inspection$actionsArgs<ExtArgs>
    _count?: boolean | InspectionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type InspectionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }
  export type InspectionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    hive?: boolean | HiveDefaultArgs<ExtArgs>
  }

  export type $InspectionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Inspection"
    objects: {
      hive: Prisma.$HivePayload<ExtArgs>
      observations: Prisma.$ObservationPayload<ExtArgs>[]
      actions: Prisma.$ActionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      hiveId: string
      date: Date
      weatherConditions: string | null
    }, ExtArgs["result"]["inspection"]>
    composites: {}
  }

  type InspectionGetPayload<S extends boolean | null | undefined | InspectionDefaultArgs> = $Result.GetResult<Prisma.$InspectionPayload, S>

  type InspectionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InspectionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InspectionCountAggregateInputType | true
    }

  export interface InspectionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Inspection'], meta: { name: 'Inspection' } }
    /**
     * Find zero or one Inspection that matches the filter.
     * @param {InspectionFindUniqueArgs} args - Arguments to find a Inspection
     * @example
     * // Get one Inspection
     * const inspection = await prisma.inspection.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InspectionFindUniqueArgs>(args: SelectSubset<T, InspectionFindUniqueArgs<ExtArgs>>): Prisma__InspectionClient<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Inspection that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InspectionFindUniqueOrThrowArgs} args - Arguments to find a Inspection
     * @example
     * // Get one Inspection
     * const inspection = await prisma.inspection.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InspectionFindUniqueOrThrowArgs>(args: SelectSubset<T, InspectionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InspectionClient<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Inspection that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectionFindFirstArgs} args - Arguments to find a Inspection
     * @example
     * // Get one Inspection
     * const inspection = await prisma.inspection.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InspectionFindFirstArgs>(args?: SelectSubset<T, InspectionFindFirstArgs<ExtArgs>>): Prisma__InspectionClient<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Inspection that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectionFindFirstOrThrowArgs} args - Arguments to find a Inspection
     * @example
     * // Get one Inspection
     * const inspection = await prisma.inspection.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InspectionFindFirstOrThrowArgs>(args?: SelectSubset<T, InspectionFindFirstOrThrowArgs<ExtArgs>>): Prisma__InspectionClient<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Inspections that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Inspections
     * const inspections = await prisma.inspection.findMany()
     * 
     * // Get first 10 Inspections
     * const inspections = await prisma.inspection.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const inspectionWithIdOnly = await prisma.inspection.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InspectionFindManyArgs>(args?: SelectSubset<T, InspectionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Inspection.
     * @param {InspectionCreateArgs} args - Arguments to create a Inspection.
     * @example
     * // Create one Inspection
     * const Inspection = await prisma.inspection.create({
     *   data: {
     *     // ... data to create a Inspection
     *   }
     * })
     * 
     */
    create<T extends InspectionCreateArgs>(args: SelectSubset<T, InspectionCreateArgs<ExtArgs>>): Prisma__InspectionClient<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Inspections.
     * @param {InspectionCreateManyArgs} args - Arguments to create many Inspections.
     * @example
     * // Create many Inspections
     * const inspection = await prisma.inspection.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InspectionCreateManyArgs>(args?: SelectSubset<T, InspectionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Inspections and returns the data saved in the database.
     * @param {InspectionCreateManyAndReturnArgs} args - Arguments to create many Inspections.
     * @example
     * // Create many Inspections
     * const inspection = await prisma.inspection.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Inspections and only return the `id`
     * const inspectionWithIdOnly = await prisma.inspection.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InspectionCreateManyAndReturnArgs>(args?: SelectSubset<T, InspectionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Inspection.
     * @param {InspectionDeleteArgs} args - Arguments to delete one Inspection.
     * @example
     * // Delete one Inspection
     * const Inspection = await prisma.inspection.delete({
     *   where: {
     *     // ... filter to delete one Inspection
     *   }
     * })
     * 
     */
    delete<T extends InspectionDeleteArgs>(args: SelectSubset<T, InspectionDeleteArgs<ExtArgs>>): Prisma__InspectionClient<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Inspection.
     * @param {InspectionUpdateArgs} args - Arguments to update one Inspection.
     * @example
     * // Update one Inspection
     * const inspection = await prisma.inspection.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InspectionUpdateArgs>(args: SelectSubset<T, InspectionUpdateArgs<ExtArgs>>): Prisma__InspectionClient<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Inspections.
     * @param {InspectionDeleteManyArgs} args - Arguments to filter Inspections to delete.
     * @example
     * // Delete a few Inspections
     * const { count } = await prisma.inspection.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InspectionDeleteManyArgs>(args?: SelectSubset<T, InspectionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Inspections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Inspections
     * const inspection = await prisma.inspection.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InspectionUpdateManyArgs>(args: SelectSubset<T, InspectionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Inspections and returns the data updated in the database.
     * @param {InspectionUpdateManyAndReturnArgs} args - Arguments to update many Inspections.
     * @example
     * // Update many Inspections
     * const inspection = await prisma.inspection.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Inspections and only return the `id`
     * const inspectionWithIdOnly = await prisma.inspection.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends InspectionUpdateManyAndReturnArgs>(args: SelectSubset<T, InspectionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Inspection.
     * @param {InspectionUpsertArgs} args - Arguments to update or create a Inspection.
     * @example
     * // Update or create a Inspection
     * const inspection = await prisma.inspection.upsert({
     *   create: {
     *     // ... data to create a Inspection
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Inspection we want to update
     *   }
     * })
     */
    upsert<T extends InspectionUpsertArgs>(args: SelectSubset<T, InspectionUpsertArgs<ExtArgs>>): Prisma__InspectionClient<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Inspections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectionCountArgs} args - Arguments to filter Inspections to count.
     * @example
     * // Count the number of Inspections
     * const count = await prisma.inspection.count({
     *   where: {
     *     // ... the filter for the Inspections we want to count
     *   }
     * })
    **/
    count<T extends InspectionCountArgs>(
      args?: Subset<T, InspectionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InspectionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Inspection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InspectionAggregateArgs>(args: Subset<T, InspectionAggregateArgs>): Prisma.PrismaPromise<GetInspectionAggregateType<T>>

    /**
     * Group by Inspection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InspectionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InspectionGroupByArgs['orderBy'] }
        : { orderBy?: InspectionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InspectionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInspectionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Inspection model
   */
  readonly fields: InspectionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Inspection.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InspectionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    hive<T extends HiveDefaultArgs<ExtArgs> = {}>(args?: Subset<T, HiveDefaultArgs<ExtArgs>>): Prisma__HiveClient<$Result.GetResult<Prisma.$HivePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    observations<T extends Inspection$observationsArgs<ExtArgs> = {}>(args?: Subset<T, Inspection$observationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ObservationPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    actions<T extends Inspection$actionsArgs<ExtArgs> = {}>(args?: Subset<T, Inspection$actionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActionPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Inspection model
   */ 
  interface InspectionFieldRefs {
    readonly id: FieldRef<"Inspection", 'String'>
    readonly hiveId: FieldRef<"Inspection", 'String'>
    readonly date: FieldRef<"Inspection", 'DateTime'>
    readonly weatherConditions: FieldRef<"Inspection", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Inspection findUnique
   */
  export type InspectionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspection
     */
    select?: InspectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspection
     */
    omit?: InspectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InspectionInclude<ExtArgs> | null
    /**
     * Filter, which Inspection to fetch.
     */
    where: InspectionWhereUniqueInput
  }

  /**
   * Inspection findUniqueOrThrow
   */
  export type InspectionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspection
     */
    select?: InspectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspection
     */
    omit?: InspectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InspectionInclude<ExtArgs> | null
    /**
     * Filter, which Inspection to fetch.
     */
    where: InspectionWhereUniqueInput
  }

  /**
   * Inspection findFirst
   */
  export type InspectionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspection
     */
    select?: InspectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspection
     */
    omit?: InspectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InspectionInclude<ExtArgs> | null
    /**
     * Filter, which Inspection to fetch.
     */
    where?: InspectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inspections to fetch.
     */
    orderBy?: InspectionOrderByWithRelationInput | InspectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Inspections.
     */
    cursor?: InspectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inspections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inspections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Inspections.
     */
    distinct?: InspectionScalarFieldEnum | InspectionScalarFieldEnum[]
  }

  /**
   * Inspection findFirstOrThrow
   */
  export type InspectionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspection
     */
    select?: InspectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspection
     */
    omit?: InspectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InspectionInclude<ExtArgs> | null
    /**
     * Filter, which Inspection to fetch.
     */
    where?: InspectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inspections to fetch.
     */
    orderBy?: InspectionOrderByWithRelationInput | InspectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Inspections.
     */
    cursor?: InspectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inspections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inspections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Inspections.
     */
    distinct?: InspectionScalarFieldEnum | InspectionScalarFieldEnum[]
  }

  /**
   * Inspection findMany
   */
  export type InspectionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspection
     */
    select?: InspectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspection
     */
    omit?: InspectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InspectionInclude<ExtArgs> | null
    /**
     * Filter, which Inspections to fetch.
     */
    where?: InspectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inspections to fetch.
     */
    orderBy?: InspectionOrderByWithRelationInput | InspectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Inspections.
     */
    cursor?: InspectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inspections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inspections.
     */
    skip?: number
    distinct?: InspectionScalarFieldEnum | InspectionScalarFieldEnum[]
  }

  /**
   * Inspection create
   */
  export type InspectionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspection
     */
    select?: InspectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspection
     */
    omit?: InspectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InspectionInclude<ExtArgs> | null
    /**
     * The data needed to create a Inspection.
     */
    data: XOR<InspectionCreateInput, InspectionUncheckedCreateInput>
  }

  /**
   * Inspection createMany
   */
  export type InspectionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Inspections.
     */
    data: InspectionCreateManyInput | InspectionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Inspection createManyAndReturn
   */
  export type InspectionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspection
     */
    select?: InspectionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Inspection
     */
    omit?: InspectionOmit<ExtArgs> | null
    /**
     * The data used to create many Inspections.
     */
    data: InspectionCreateManyInput | InspectionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InspectionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Inspection update
   */
  export type InspectionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspection
     */
    select?: InspectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspection
     */
    omit?: InspectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InspectionInclude<ExtArgs> | null
    /**
     * The data needed to update a Inspection.
     */
    data: XOR<InspectionUpdateInput, InspectionUncheckedUpdateInput>
    /**
     * Choose, which Inspection to update.
     */
    where: InspectionWhereUniqueInput
  }

  /**
   * Inspection updateMany
   */
  export type InspectionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Inspections.
     */
    data: XOR<InspectionUpdateManyMutationInput, InspectionUncheckedUpdateManyInput>
    /**
     * Filter which Inspections to update
     */
    where?: InspectionWhereInput
    /**
     * Limit how many Inspections to update.
     */
    limit?: number
  }

  /**
   * Inspection updateManyAndReturn
   */
  export type InspectionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspection
     */
    select?: InspectionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Inspection
     */
    omit?: InspectionOmit<ExtArgs> | null
    /**
     * The data used to update Inspections.
     */
    data: XOR<InspectionUpdateManyMutationInput, InspectionUncheckedUpdateManyInput>
    /**
     * Filter which Inspections to update
     */
    where?: InspectionWhereInput
    /**
     * Limit how many Inspections to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InspectionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Inspection upsert
   */
  export type InspectionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspection
     */
    select?: InspectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspection
     */
    omit?: InspectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InspectionInclude<ExtArgs> | null
    /**
     * The filter to search for the Inspection to update in case it exists.
     */
    where: InspectionWhereUniqueInput
    /**
     * In case the Inspection found by the `where` argument doesn't exist, create a new Inspection with this data.
     */
    create: XOR<InspectionCreateInput, InspectionUncheckedCreateInput>
    /**
     * In case the Inspection was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InspectionUpdateInput, InspectionUncheckedUpdateInput>
  }

  /**
   * Inspection delete
   */
  export type InspectionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspection
     */
    select?: InspectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspection
     */
    omit?: InspectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InspectionInclude<ExtArgs> | null
    /**
     * Filter which Inspection to delete.
     */
    where: InspectionWhereUniqueInput
  }

  /**
   * Inspection deleteMany
   */
  export type InspectionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Inspections to delete
     */
    where?: InspectionWhereInput
    /**
     * Limit how many Inspections to delete.
     */
    limit?: number
  }

  /**
   * Inspection.observations
   */
  export type Inspection$observationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Observation
     */
    select?: ObservationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Observation
     */
    omit?: ObservationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ObservationInclude<ExtArgs> | null
    where?: ObservationWhereInput
    orderBy?: ObservationOrderByWithRelationInput | ObservationOrderByWithRelationInput[]
    cursor?: ObservationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ObservationScalarFieldEnum | ObservationScalarFieldEnum[]
  }

  /**
   * Inspection.actions
   */
  export type Inspection$actionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Action
     */
    select?: ActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Action
     */
    omit?: ActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActionInclude<ExtArgs> | null
    where?: ActionWhereInput
    orderBy?: ActionOrderByWithRelationInput | ActionOrderByWithRelationInput[]
    cursor?: ActionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ActionScalarFieldEnum | ActionScalarFieldEnum[]
  }

  /**
   * Inspection without action
   */
  export type InspectionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspection
     */
    select?: InspectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspection
     */
    omit?: InspectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InspectionInclude<ExtArgs> | null
  }


  /**
   * Model Observation
   */

  export type AggregateObservation = {
    _count: ObservationCountAggregateOutputType | null
    _avg: ObservationAvgAggregateOutputType | null
    _sum: ObservationSumAggregateOutputType | null
    _min: ObservationMinAggregateOutputType | null
    _max: ObservationMaxAggregateOutputType | null
  }

  export type ObservationAvgAggregateOutputType = {
    numericValue: number | null
  }

  export type ObservationSumAggregateOutputType = {
    numericValue: number | null
  }

  export type ObservationMinAggregateOutputType = {
    id: string | null
    inspectionId: string | null
    type: string | null
    numericValue: number | null
    textValue: string | null
    notes: string | null
  }

  export type ObservationMaxAggregateOutputType = {
    id: string | null
    inspectionId: string | null
    type: string | null
    numericValue: number | null
    textValue: string | null
    notes: string | null
  }

  export type ObservationCountAggregateOutputType = {
    id: number
    inspectionId: number
    type: number
    numericValue: number
    textValue: number
    notes: number
    _all: number
  }


  export type ObservationAvgAggregateInputType = {
    numericValue?: true
  }

  export type ObservationSumAggregateInputType = {
    numericValue?: true
  }

  export type ObservationMinAggregateInputType = {
    id?: true
    inspectionId?: true
    type?: true
    numericValue?: true
    textValue?: true
    notes?: true
  }

  export type ObservationMaxAggregateInputType = {
    id?: true
    inspectionId?: true
    type?: true
    numericValue?: true
    textValue?: true
    notes?: true
  }

  export type ObservationCountAggregateInputType = {
    id?: true
    inspectionId?: true
    type?: true
    numericValue?: true
    textValue?: true
    notes?: true
    _all?: true
  }

  export type ObservationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Observation to aggregate.
     */
    where?: ObservationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Observations to fetch.
     */
    orderBy?: ObservationOrderByWithRelationInput | ObservationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ObservationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Observations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Observations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Observations
    **/
    _count?: true | ObservationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ObservationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ObservationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ObservationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ObservationMaxAggregateInputType
  }

  export type GetObservationAggregateType<T extends ObservationAggregateArgs> = {
        [P in keyof T & keyof AggregateObservation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateObservation[P]>
      : GetScalarType<T[P], AggregateObservation[P]>
  }




  export type ObservationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ObservationWhereInput
    orderBy?: ObservationOrderByWithAggregationInput | ObservationOrderByWithAggregationInput[]
    by: ObservationScalarFieldEnum[] | ObservationScalarFieldEnum
    having?: ObservationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ObservationCountAggregateInputType | true
    _avg?: ObservationAvgAggregateInputType
    _sum?: ObservationSumAggregateInputType
    _min?: ObservationMinAggregateInputType
    _max?: ObservationMaxAggregateInputType
  }

  export type ObservationGroupByOutputType = {
    id: string
    inspectionId: string
    type: string
    numericValue: number | null
    textValue: string | null
    notes: string | null
    _count: ObservationCountAggregateOutputType | null
    _avg: ObservationAvgAggregateOutputType | null
    _sum: ObservationSumAggregateOutputType | null
    _min: ObservationMinAggregateOutputType | null
    _max: ObservationMaxAggregateOutputType | null
  }

  type GetObservationGroupByPayload<T extends ObservationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ObservationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ObservationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ObservationGroupByOutputType[P]>
            : GetScalarType<T[P], ObservationGroupByOutputType[P]>
        }
      >
    >


  export type ObservationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inspectionId?: boolean
    type?: boolean
    numericValue?: boolean
    textValue?: boolean
    notes?: boolean
    inspection?: boolean | InspectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["observation"]>

  export type ObservationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inspectionId?: boolean
    type?: boolean
    numericValue?: boolean
    textValue?: boolean
    notes?: boolean
    inspection?: boolean | InspectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["observation"]>

  export type ObservationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inspectionId?: boolean
    type?: boolean
    numericValue?: boolean
    textValue?: boolean
    notes?: boolean
    inspection?: boolean | InspectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["observation"]>

  export type ObservationSelectScalar = {
    id?: boolean
    inspectionId?: boolean
    type?: boolean
    numericValue?: boolean
    textValue?: boolean
    notes?: boolean
  }

  export type ObservationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "inspectionId" | "type" | "numericValue" | "textValue" | "notes", ExtArgs["result"]["observation"]>
  export type ObservationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inspection?: boolean | InspectionDefaultArgs<ExtArgs>
  }
  export type ObservationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inspection?: boolean | InspectionDefaultArgs<ExtArgs>
  }
  export type ObservationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inspection?: boolean | InspectionDefaultArgs<ExtArgs>
  }

  export type $ObservationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Observation"
    objects: {
      inspection: Prisma.$InspectionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      inspectionId: string
      type: string
      numericValue: number | null
      textValue: string | null
      notes: string | null
    }, ExtArgs["result"]["observation"]>
    composites: {}
  }

  type ObservationGetPayload<S extends boolean | null | undefined | ObservationDefaultArgs> = $Result.GetResult<Prisma.$ObservationPayload, S>

  type ObservationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ObservationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ObservationCountAggregateInputType | true
    }

  export interface ObservationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Observation'], meta: { name: 'Observation' } }
    /**
     * Find zero or one Observation that matches the filter.
     * @param {ObservationFindUniqueArgs} args - Arguments to find a Observation
     * @example
     * // Get one Observation
     * const observation = await prisma.observation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ObservationFindUniqueArgs>(args: SelectSubset<T, ObservationFindUniqueArgs<ExtArgs>>): Prisma__ObservationClient<$Result.GetResult<Prisma.$ObservationPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Observation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ObservationFindUniqueOrThrowArgs} args - Arguments to find a Observation
     * @example
     * // Get one Observation
     * const observation = await prisma.observation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ObservationFindUniqueOrThrowArgs>(args: SelectSubset<T, ObservationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ObservationClient<$Result.GetResult<Prisma.$ObservationPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Observation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ObservationFindFirstArgs} args - Arguments to find a Observation
     * @example
     * // Get one Observation
     * const observation = await prisma.observation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ObservationFindFirstArgs>(args?: SelectSubset<T, ObservationFindFirstArgs<ExtArgs>>): Prisma__ObservationClient<$Result.GetResult<Prisma.$ObservationPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Observation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ObservationFindFirstOrThrowArgs} args - Arguments to find a Observation
     * @example
     * // Get one Observation
     * const observation = await prisma.observation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ObservationFindFirstOrThrowArgs>(args?: SelectSubset<T, ObservationFindFirstOrThrowArgs<ExtArgs>>): Prisma__ObservationClient<$Result.GetResult<Prisma.$ObservationPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Observations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ObservationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Observations
     * const observations = await prisma.observation.findMany()
     * 
     * // Get first 10 Observations
     * const observations = await prisma.observation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const observationWithIdOnly = await prisma.observation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ObservationFindManyArgs>(args?: SelectSubset<T, ObservationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ObservationPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Observation.
     * @param {ObservationCreateArgs} args - Arguments to create a Observation.
     * @example
     * // Create one Observation
     * const Observation = await prisma.observation.create({
     *   data: {
     *     // ... data to create a Observation
     *   }
     * })
     * 
     */
    create<T extends ObservationCreateArgs>(args: SelectSubset<T, ObservationCreateArgs<ExtArgs>>): Prisma__ObservationClient<$Result.GetResult<Prisma.$ObservationPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Observations.
     * @param {ObservationCreateManyArgs} args - Arguments to create many Observations.
     * @example
     * // Create many Observations
     * const observation = await prisma.observation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ObservationCreateManyArgs>(args?: SelectSubset<T, ObservationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Observations and returns the data saved in the database.
     * @param {ObservationCreateManyAndReturnArgs} args - Arguments to create many Observations.
     * @example
     * // Create many Observations
     * const observation = await prisma.observation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Observations and only return the `id`
     * const observationWithIdOnly = await prisma.observation.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ObservationCreateManyAndReturnArgs>(args?: SelectSubset<T, ObservationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ObservationPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Observation.
     * @param {ObservationDeleteArgs} args - Arguments to delete one Observation.
     * @example
     * // Delete one Observation
     * const Observation = await prisma.observation.delete({
     *   where: {
     *     // ... filter to delete one Observation
     *   }
     * })
     * 
     */
    delete<T extends ObservationDeleteArgs>(args: SelectSubset<T, ObservationDeleteArgs<ExtArgs>>): Prisma__ObservationClient<$Result.GetResult<Prisma.$ObservationPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Observation.
     * @param {ObservationUpdateArgs} args - Arguments to update one Observation.
     * @example
     * // Update one Observation
     * const observation = await prisma.observation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ObservationUpdateArgs>(args: SelectSubset<T, ObservationUpdateArgs<ExtArgs>>): Prisma__ObservationClient<$Result.GetResult<Prisma.$ObservationPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Observations.
     * @param {ObservationDeleteManyArgs} args - Arguments to filter Observations to delete.
     * @example
     * // Delete a few Observations
     * const { count } = await prisma.observation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ObservationDeleteManyArgs>(args?: SelectSubset<T, ObservationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Observations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ObservationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Observations
     * const observation = await prisma.observation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ObservationUpdateManyArgs>(args: SelectSubset<T, ObservationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Observations and returns the data updated in the database.
     * @param {ObservationUpdateManyAndReturnArgs} args - Arguments to update many Observations.
     * @example
     * // Update many Observations
     * const observation = await prisma.observation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Observations and only return the `id`
     * const observationWithIdOnly = await prisma.observation.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ObservationUpdateManyAndReturnArgs>(args: SelectSubset<T, ObservationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ObservationPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Observation.
     * @param {ObservationUpsertArgs} args - Arguments to update or create a Observation.
     * @example
     * // Update or create a Observation
     * const observation = await prisma.observation.upsert({
     *   create: {
     *     // ... data to create a Observation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Observation we want to update
     *   }
     * })
     */
    upsert<T extends ObservationUpsertArgs>(args: SelectSubset<T, ObservationUpsertArgs<ExtArgs>>): Prisma__ObservationClient<$Result.GetResult<Prisma.$ObservationPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Observations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ObservationCountArgs} args - Arguments to filter Observations to count.
     * @example
     * // Count the number of Observations
     * const count = await prisma.observation.count({
     *   where: {
     *     // ... the filter for the Observations we want to count
     *   }
     * })
    **/
    count<T extends ObservationCountArgs>(
      args?: Subset<T, ObservationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ObservationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Observation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ObservationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ObservationAggregateArgs>(args: Subset<T, ObservationAggregateArgs>): Prisma.PrismaPromise<GetObservationAggregateType<T>>

    /**
     * Group by Observation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ObservationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ObservationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ObservationGroupByArgs['orderBy'] }
        : { orderBy?: ObservationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ObservationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetObservationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Observation model
   */
  readonly fields: ObservationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Observation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ObservationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    inspection<T extends InspectionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InspectionDefaultArgs<ExtArgs>>): Prisma__InspectionClient<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Observation model
   */ 
  interface ObservationFieldRefs {
    readonly id: FieldRef<"Observation", 'String'>
    readonly inspectionId: FieldRef<"Observation", 'String'>
    readonly type: FieldRef<"Observation", 'String'>
    readonly numericValue: FieldRef<"Observation", 'Float'>
    readonly textValue: FieldRef<"Observation", 'String'>
    readonly notes: FieldRef<"Observation", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Observation findUnique
   */
  export type ObservationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Observation
     */
    select?: ObservationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Observation
     */
    omit?: ObservationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ObservationInclude<ExtArgs> | null
    /**
     * Filter, which Observation to fetch.
     */
    where: ObservationWhereUniqueInput
  }

  /**
   * Observation findUniqueOrThrow
   */
  export type ObservationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Observation
     */
    select?: ObservationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Observation
     */
    omit?: ObservationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ObservationInclude<ExtArgs> | null
    /**
     * Filter, which Observation to fetch.
     */
    where: ObservationWhereUniqueInput
  }

  /**
   * Observation findFirst
   */
  export type ObservationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Observation
     */
    select?: ObservationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Observation
     */
    omit?: ObservationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ObservationInclude<ExtArgs> | null
    /**
     * Filter, which Observation to fetch.
     */
    where?: ObservationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Observations to fetch.
     */
    orderBy?: ObservationOrderByWithRelationInput | ObservationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Observations.
     */
    cursor?: ObservationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Observations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Observations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Observations.
     */
    distinct?: ObservationScalarFieldEnum | ObservationScalarFieldEnum[]
  }

  /**
   * Observation findFirstOrThrow
   */
  export type ObservationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Observation
     */
    select?: ObservationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Observation
     */
    omit?: ObservationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ObservationInclude<ExtArgs> | null
    /**
     * Filter, which Observation to fetch.
     */
    where?: ObservationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Observations to fetch.
     */
    orderBy?: ObservationOrderByWithRelationInput | ObservationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Observations.
     */
    cursor?: ObservationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Observations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Observations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Observations.
     */
    distinct?: ObservationScalarFieldEnum | ObservationScalarFieldEnum[]
  }

  /**
   * Observation findMany
   */
  export type ObservationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Observation
     */
    select?: ObservationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Observation
     */
    omit?: ObservationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ObservationInclude<ExtArgs> | null
    /**
     * Filter, which Observations to fetch.
     */
    where?: ObservationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Observations to fetch.
     */
    orderBy?: ObservationOrderByWithRelationInput | ObservationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Observations.
     */
    cursor?: ObservationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Observations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Observations.
     */
    skip?: number
    distinct?: ObservationScalarFieldEnum | ObservationScalarFieldEnum[]
  }

  /**
   * Observation create
   */
  export type ObservationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Observation
     */
    select?: ObservationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Observation
     */
    omit?: ObservationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ObservationInclude<ExtArgs> | null
    /**
     * The data needed to create a Observation.
     */
    data: XOR<ObservationCreateInput, ObservationUncheckedCreateInput>
  }

  /**
   * Observation createMany
   */
  export type ObservationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Observations.
     */
    data: ObservationCreateManyInput | ObservationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Observation createManyAndReturn
   */
  export type ObservationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Observation
     */
    select?: ObservationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Observation
     */
    omit?: ObservationOmit<ExtArgs> | null
    /**
     * The data used to create many Observations.
     */
    data: ObservationCreateManyInput | ObservationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ObservationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Observation update
   */
  export type ObservationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Observation
     */
    select?: ObservationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Observation
     */
    omit?: ObservationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ObservationInclude<ExtArgs> | null
    /**
     * The data needed to update a Observation.
     */
    data: XOR<ObservationUpdateInput, ObservationUncheckedUpdateInput>
    /**
     * Choose, which Observation to update.
     */
    where: ObservationWhereUniqueInput
  }

  /**
   * Observation updateMany
   */
  export type ObservationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Observations.
     */
    data: XOR<ObservationUpdateManyMutationInput, ObservationUncheckedUpdateManyInput>
    /**
     * Filter which Observations to update
     */
    where?: ObservationWhereInput
    /**
     * Limit how many Observations to update.
     */
    limit?: number
  }

  /**
   * Observation updateManyAndReturn
   */
  export type ObservationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Observation
     */
    select?: ObservationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Observation
     */
    omit?: ObservationOmit<ExtArgs> | null
    /**
     * The data used to update Observations.
     */
    data: XOR<ObservationUpdateManyMutationInput, ObservationUncheckedUpdateManyInput>
    /**
     * Filter which Observations to update
     */
    where?: ObservationWhereInput
    /**
     * Limit how many Observations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ObservationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Observation upsert
   */
  export type ObservationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Observation
     */
    select?: ObservationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Observation
     */
    omit?: ObservationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ObservationInclude<ExtArgs> | null
    /**
     * The filter to search for the Observation to update in case it exists.
     */
    where: ObservationWhereUniqueInput
    /**
     * In case the Observation found by the `where` argument doesn't exist, create a new Observation with this data.
     */
    create: XOR<ObservationCreateInput, ObservationUncheckedCreateInput>
    /**
     * In case the Observation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ObservationUpdateInput, ObservationUncheckedUpdateInput>
  }

  /**
   * Observation delete
   */
  export type ObservationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Observation
     */
    select?: ObservationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Observation
     */
    omit?: ObservationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ObservationInclude<ExtArgs> | null
    /**
     * Filter which Observation to delete.
     */
    where: ObservationWhereUniqueInput
  }

  /**
   * Observation deleteMany
   */
  export type ObservationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Observations to delete
     */
    where?: ObservationWhereInput
    /**
     * Limit how many Observations to delete.
     */
    limit?: number
  }

  /**
   * Observation without action
   */
  export type ObservationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Observation
     */
    select?: ObservationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Observation
     */
    omit?: ObservationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ObservationInclude<ExtArgs> | null
  }


  /**
   * Model Action
   */

  export type AggregateAction = {
    _count: ActionCountAggregateOutputType | null
    _min: ActionMinAggregateOutputType | null
    _max: ActionMaxAggregateOutputType | null
  }

  export type ActionMinAggregateOutputType = {
    id: string | null
    inspectionId: string | null
    type: string | null
    notes: string | null
  }

  export type ActionMaxAggregateOutputType = {
    id: string | null
    inspectionId: string | null
    type: string | null
    notes: string | null
  }

  export type ActionCountAggregateOutputType = {
    id: number
    inspectionId: number
    type: number
    notes: number
    _all: number
  }


  export type ActionMinAggregateInputType = {
    id?: true
    inspectionId?: true
    type?: true
    notes?: true
  }

  export type ActionMaxAggregateInputType = {
    id?: true
    inspectionId?: true
    type?: true
    notes?: true
  }

  export type ActionCountAggregateInputType = {
    id?: true
    inspectionId?: true
    type?: true
    notes?: true
    _all?: true
  }

  export type ActionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Action to aggregate.
     */
    where?: ActionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Actions to fetch.
     */
    orderBy?: ActionOrderByWithRelationInput | ActionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ActionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Actions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Actions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Actions
    **/
    _count?: true | ActionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ActionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ActionMaxAggregateInputType
  }

  export type GetActionAggregateType<T extends ActionAggregateArgs> = {
        [P in keyof T & keyof AggregateAction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAction[P]>
      : GetScalarType<T[P], AggregateAction[P]>
  }




  export type ActionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ActionWhereInput
    orderBy?: ActionOrderByWithAggregationInput | ActionOrderByWithAggregationInput[]
    by: ActionScalarFieldEnum[] | ActionScalarFieldEnum
    having?: ActionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ActionCountAggregateInputType | true
    _min?: ActionMinAggregateInputType
    _max?: ActionMaxAggregateInputType
  }

  export type ActionGroupByOutputType = {
    id: string
    inspectionId: string
    type: string
    notes: string | null
    _count: ActionCountAggregateOutputType | null
    _min: ActionMinAggregateOutputType | null
    _max: ActionMaxAggregateOutputType | null
  }

  type GetActionGroupByPayload<T extends ActionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ActionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ActionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ActionGroupByOutputType[P]>
            : GetScalarType<T[P], ActionGroupByOutputType[P]>
        }
      >
    >


  export type ActionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inspectionId?: boolean
    type?: boolean
    notes?: boolean
    inspection?: boolean | InspectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["action"]>

  export type ActionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inspectionId?: boolean
    type?: boolean
    notes?: boolean
    inspection?: boolean | InspectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["action"]>

  export type ActionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inspectionId?: boolean
    type?: boolean
    notes?: boolean
    inspection?: boolean | InspectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["action"]>

  export type ActionSelectScalar = {
    id?: boolean
    inspectionId?: boolean
    type?: boolean
    notes?: boolean
  }

  export type ActionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "inspectionId" | "type" | "notes", ExtArgs["result"]["action"]>
  export type ActionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inspection?: boolean | InspectionDefaultArgs<ExtArgs>
  }
  export type ActionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inspection?: boolean | InspectionDefaultArgs<ExtArgs>
  }
  export type ActionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inspection?: boolean | InspectionDefaultArgs<ExtArgs>
  }

  export type $ActionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Action"
    objects: {
      inspection: Prisma.$InspectionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      inspectionId: string
      type: string
      notes: string | null
    }, ExtArgs["result"]["action"]>
    composites: {}
  }

  type ActionGetPayload<S extends boolean | null | undefined | ActionDefaultArgs> = $Result.GetResult<Prisma.$ActionPayload, S>

  type ActionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ActionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ActionCountAggregateInputType | true
    }

  export interface ActionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Action'], meta: { name: 'Action' } }
    /**
     * Find zero or one Action that matches the filter.
     * @param {ActionFindUniqueArgs} args - Arguments to find a Action
     * @example
     * // Get one Action
     * const action = await prisma.action.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ActionFindUniqueArgs>(args: SelectSubset<T, ActionFindUniqueArgs<ExtArgs>>): Prisma__ActionClient<$Result.GetResult<Prisma.$ActionPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Action that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ActionFindUniqueOrThrowArgs} args - Arguments to find a Action
     * @example
     * // Get one Action
     * const action = await prisma.action.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ActionFindUniqueOrThrowArgs>(args: SelectSubset<T, ActionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ActionClient<$Result.GetResult<Prisma.$ActionPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Action that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActionFindFirstArgs} args - Arguments to find a Action
     * @example
     * // Get one Action
     * const action = await prisma.action.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ActionFindFirstArgs>(args?: SelectSubset<T, ActionFindFirstArgs<ExtArgs>>): Prisma__ActionClient<$Result.GetResult<Prisma.$ActionPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Action that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActionFindFirstOrThrowArgs} args - Arguments to find a Action
     * @example
     * // Get one Action
     * const action = await prisma.action.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ActionFindFirstOrThrowArgs>(args?: SelectSubset<T, ActionFindFirstOrThrowArgs<ExtArgs>>): Prisma__ActionClient<$Result.GetResult<Prisma.$ActionPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Actions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Actions
     * const actions = await prisma.action.findMany()
     * 
     * // Get first 10 Actions
     * const actions = await prisma.action.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const actionWithIdOnly = await prisma.action.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ActionFindManyArgs>(args?: SelectSubset<T, ActionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActionPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Action.
     * @param {ActionCreateArgs} args - Arguments to create a Action.
     * @example
     * // Create one Action
     * const Action = await prisma.action.create({
     *   data: {
     *     // ... data to create a Action
     *   }
     * })
     * 
     */
    create<T extends ActionCreateArgs>(args: SelectSubset<T, ActionCreateArgs<ExtArgs>>): Prisma__ActionClient<$Result.GetResult<Prisma.$ActionPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Actions.
     * @param {ActionCreateManyArgs} args - Arguments to create many Actions.
     * @example
     * // Create many Actions
     * const action = await prisma.action.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ActionCreateManyArgs>(args?: SelectSubset<T, ActionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Actions and returns the data saved in the database.
     * @param {ActionCreateManyAndReturnArgs} args - Arguments to create many Actions.
     * @example
     * // Create many Actions
     * const action = await prisma.action.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Actions and only return the `id`
     * const actionWithIdOnly = await prisma.action.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ActionCreateManyAndReturnArgs>(args?: SelectSubset<T, ActionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActionPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Action.
     * @param {ActionDeleteArgs} args - Arguments to delete one Action.
     * @example
     * // Delete one Action
     * const Action = await prisma.action.delete({
     *   where: {
     *     // ... filter to delete one Action
     *   }
     * })
     * 
     */
    delete<T extends ActionDeleteArgs>(args: SelectSubset<T, ActionDeleteArgs<ExtArgs>>): Prisma__ActionClient<$Result.GetResult<Prisma.$ActionPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Action.
     * @param {ActionUpdateArgs} args - Arguments to update one Action.
     * @example
     * // Update one Action
     * const action = await prisma.action.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ActionUpdateArgs>(args: SelectSubset<T, ActionUpdateArgs<ExtArgs>>): Prisma__ActionClient<$Result.GetResult<Prisma.$ActionPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Actions.
     * @param {ActionDeleteManyArgs} args - Arguments to filter Actions to delete.
     * @example
     * // Delete a few Actions
     * const { count } = await prisma.action.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ActionDeleteManyArgs>(args?: SelectSubset<T, ActionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Actions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Actions
     * const action = await prisma.action.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ActionUpdateManyArgs>(args: SelectSubset<T, ActionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Actions and returns the data updated in the database.
     * @param {ActionUpdateManyAndReturnArgs} args - Arguments to update many Actions.
     * @example
     * // Update many Actions
     * const action = await prisma.action.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Actions and only return the `id`
     * const actionWithIdOnly = await prisma.action.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ActionUpdateManyAndReturnArgs>(args: SelectSubset<T, ActionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActionPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Action.
     * @param {ActionUpsertArgs} args - Arguments to update or create a Action.
     * @example
     * // Update or create a Action
     * const action = await prisma.action.upsert({
     *   create: {
     *     // ... data to create a Action
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Action we want to update
     *   }
     * })
     */
    upsert<T extends ActionUpsertArgs>(args: SelectSubset<T, ActionUpsertArgs<ExtArgs>>): Prisma__ActionClient<$Result.GetResult<Prisma.$ActionPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Actions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActionCountArgs} args - Arguments to filter Actions to count.
     * @example
     * // Count the number of Actions
     * const count = await prisma.action.count({
     *   where: {
     *     // ... the filter for the Actions we want to count
     *   }
     * })
    **/
    count<T extends ActionCountArgs>(
      args?: Subset<T, ActionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ActionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Action.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ActionAggregateArgs>(args: Subset<T, ActionAggregateArgs>): Prisma.PrismaPromise<GetActionAggregateType<T>>

    /**
     * Group by Action.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ActionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ActionGroupByArgs['orderBy'] }
        : { orderBy?: ActionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ActionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetActionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Action model
   */
  readonly fields: ActionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Action.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ActionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    inspection<T extends InspectionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InspectionDefaultArgs<ExtArgs>>): Prisma__InspectionClient<$Result.GetResult<Prisma.$InspectionPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Action model
   */ 
  interface ActionFieldRefs {
    readonly id: FieldRef<"Action", 'String'>
    readonly inspectionId: FieldRef<"Action", 'String'>
    readonly type: FieldRef<"Action", 'String'>
    readonly notes: FieldRef<"Action", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Action findUnique
   */
  export type ActionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Action
     */
    select?: ActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Action
     */
    omit?: ActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActionInclude<ExtArgs> | null
    /**
     * Filter, which Action to fetch.
     */
    where: ActionWhereUniqueInput
  }

  /**
   * Action findUniqueOrThrow
   */
  export type ActionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Action
     */
    select?: ActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Action
     */
    omit?: ActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActionInclude<ExtArgs> | null
    /**
     * Filter, which Action to fetch.
     */
    where: ActionWhereUniqueInput
  }

  /**
   * Action findFirst
   */
  export type ActionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Action
     */
    select?: ActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Action
     */
    omit?: ActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActionInclude<ExtArgs> | null
    /**
     * Filter, which Action to fetch.
     */
    where?: ActionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Actions to fetch.
     */
    orderBy?: ActionOrderByWithRelationInput | ActionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Actions.
     */
    cursor?: ActionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Actions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Actions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Actions.
     */
    distinct?: ActionScalarFieldEnum | ActionScalarFieldEnum[]
  }

  /**
   * Action findFirstOrThrow
   */
  export type ActionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Action
     */
    select?: ActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Action
     */
    omit?: ActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActionInclude<ExtArgs> | null
    /**
     * Filter, which Action to fetch.
     */
    where?: ActionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Actions to fetch.
     */
    orderBy?: ActionOrderByWithRelationInput | ActionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Actions.
     */
    cursor?: ActionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Actions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Actions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Actions.
     */
    distinct?: ActionScalarFieldEnum | ActionScalarFieldEnum[]
  }

  /**
   * Action findMany
   */
  export type ActionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Action
     */
    select?: ActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Action
     */
    omit?: ActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActionInclude<ExtArgs> | null
    /**
     * Filter, which Actions to fetch.
     */
    where?: ActionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Actions to fetch.
     */
    orderBy?: ActionOrderByWithRelationInput | ActionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Actions.
     */
    cursor?: ActionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Actions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Actions.
     */
    skip?: number
    distinct?: ActionScalarFieldEnum | ActionScalarFieldEnum[]
  }

  /**
   * Action create
   */
  export type ActionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Action
     */
    select?: ActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Action
     */
    omit?: ActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActionInclude<ExtArgs> | null
    /**
     * The data needed to create a Action.
     */
    data: XOR<ActionCreateInput, ActionUncheckedCreateInput>
  }

  /**
   * Action createMany
   */
  export type ActionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Actions.
     */
    data: ActionCreateManyInput | ActionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Action createManyAndReturn
   */
  export type ActionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Action
     */
    select?: ActionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Action
     */
    omit?: ActionOmit<ExtArgs> | null
    /**
     * The data used to create many Actions.
     */
    data: ActionCreateManyInput | ActionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Action update
   */
  export type ActionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Action
     */
    select?: ActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Action
     */
    omit?: ActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActionInclude<ExtArgs> | null
    /**
     * The data needed to update a Action.
     */
    data: XOR<ActionUpdateInput, ActionUncheckedUpdateInput>
    /**
     * Choose, which Action to update.
     */
    where: ActionWhereUniqueInput
  }

  /**
   * Action updateMany
   */
  export type ActionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Actions.
     */
    data: XOR<ActionUpdateManyMutationInput, ActionUncheckedUpdateManyInput>
    /**
     * Filter which Actions to update
     */
    where?: ActionWhereInput
    /**
     * Limit how many Actions to update.
     */
    limit?: number
  }

  /**
   * Action updateManyAndReturn
   */
  export type ActionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Action
     */
    select?: ActionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Action
     */
    omit?: ActionOmit<ExtArgs> | null
    /**
     * The data used to update Actions.
     */
    data: XOR<ActionUpdateManyMutationInput, ActionUncheckedUpdateManyInput>
    /**
     * Filter which Actions to update
     */
    where?: ActionWhereInput
    /**
     * Limit how many Actions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Action upsert
   */
  export type ActionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Action
     */
    select?: ActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Action
     */
    omit?: ActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActionInclude<ExtArgs> | null
    /**
     * The filter to search for the Action to update in case it exists.
     */
    where: ActionWhereUniqueInput
    /**
     * In case the Action found by the `where` argument doesn't exist, create a new Action with this data.
     */
    create: XOR<ActionCreateInput, ActionUncheckedCreateInput>
    /**
     * In case the Action was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ActionUpdateInput, ActionUncheckedUpdateInput>
  }

  /**
   * Action delete
   */
  export type ActionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Action
     */
    select?: ActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Action
     */
    omit?: ActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActionInclude<ExtArgs> | null
    /**
     * Filter which Action to delete.
     */
    where: ActionWhereUniqueInput
  }

  /**
   * Action deleteMany
   */
  export type ActionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Actions to delete
     */
    where?: ActionWhereInput
    /**
     * Limit how many Actions to delete.
     */
    limit?: number
  }

  /**
   * Action without action
   */
  export type ActionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Action
     */
    select?: ActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Action
     */
    omit?: ActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ActionInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ApiaryScalarFieldEnum: {
    id: 'id',
    name: 'name',
    location: 'location',
    latitude: 'latitude',
    longitude: 'longitude',
    notes: 'notes'
  };

  export type ApiaryScalarFieldEnum = (typeof ApiaryScalarFieldEnum)[keyof typeof ApiaryScalarFieldEnum]


  export const HiveScalarFieldEnum: {
    id: 'id',
    name: 'name',
    apiaryId: 'apiaryId',
    status: 'status',
    installationDate: 'installationDate'
  };

  export type HiveScalarFieldEnum = (typeof HiveScalarFieldEnum)[keyof typeof HiveScalarFieldEnum]


  export const BoxScalarFieldEnum: {
    id: 'id',
    hiveId: 'hiveId',
    position: 'position',
    frameCount: 'frameCount',
    hasExcluder: 'hasExcluder',
    type: 'type'
  };

  export type BoxScalarFieldEnum = (typeof BoxScalarFieldEnum)[keyof typeof BoxScalarFieldEnum]


  export const QueenScalarFieldEnum: {
    id: 'id',
    hiveId: 'hiveId',
    markingColor: 'markingColor',
    year: 'year',
    source: 'source',
    status: 'status',
    installedAt: 'installedAt',
    replacedAt: 'replacedAt'
  };

  export type QueenScalarFieldEnum = (typeof QueenScalarFieldEnum)[keyof typeof QueenScalarFieldEnum]


  export const InspectionScalarFieldEnum: {
    id: 'id',
    hiveId: 'hiveId',
    date: 'date',
    weatherConditions: 'weatherConditions'
  };

  export type InspectionScalarFieldEnum = (typeof InspectionScalarFieldEnum)[keyof typeof InspectionScalarFieldEnum]


  export const ObservationScalarFieldEnum: {
    id: 'id',
    inspectionId: 'inspectionId',
    type: 'type',
    numericValue: 'numericValue',
    textValue: 'textValue',
    notes: 'notes'
  };

  export type ObservationScalarFieldEnum = (typeof ObservationScalarFieldEnum)[keyof typeof ObservationScalarFieldEnum]


  export const ActionScalarFieldEnum: {
    id: 'id',
    inspectionId: 'inspectionId',
    type: 'type',
    notes: 'notes'
  };

  export type ActionScalarFieldEnum = (typeof ActionScalarFieldEnum)[keyof typeof ActionScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'HiveStatus'
   */
  export type EnumHiveStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'HiveStatus'>
    


  /**
   * Reference to a field of type 'HiveStatus[]'
   */
  export type ListEnumHiveStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'HiveStatus[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'BoxType'
   */
  export type EnumBoxTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BoxType'>
    


  /**
   * Reference to a field of type 'BoxType[]'
   */
  export type ListEnumBoxTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BoxType[]'>
    


  /**
   * Reference to a field of type 'QueenStatus'
   */
  export type EnumQueenStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueenStatus'>
    


  /**
   * Reference to a field of type 'QueenStatus[]'
   */
  export type ListEnumQueenStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueenStatus[]'>
    
  /**
   * Deep Input Types
   */


  export type ApiaryWhereInput = {
    AND?: ApiaryWhereInput | ApiaryWhereInput[]
    OR?: ApiaryWhereInput[]
    NOT?: ApiaryWhereInput | ApiaryWhereInput[]
    id?: StringFilter<"Apiary"> | string
    name?: StringFilter<"Apiary"> | string
    location?: StringNullableFilter<"Apiary"> | string | null
    latitude?: FloatNullableFilter<"Apiary"> | number | null
    longitude?: FloatNullableFilter<"Apiary"> | number | null
    notes?: StringNullableFilter<"Apiary"> | string | null
    hives?: HiveListRelationFilter
  }

  export type ApiaryOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    location?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    hives?: HiveOrderByRelationAggregateInput
  }

  export type ApiaryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ApiaryWhereInput | ApiaryWhereInput[]
    OR?: ApiaryWhereInput[]
    NOT?: ApiaryWhereInput | ApiaryWhereInput[]
    name?: StringFilter<"Apiary"> | string
    location?: StringNullableFilter<"Apiary"> | string | null
    latitude?: FloatNullableFilter<"Apiary"> | number | null
    longitude?: FloatNullableFilter<"Apiary"> | number | null
    notes?: StringNullableFilter<"Apiary"> | string | null
    hives?: HiveListRelationFilter
  }, "id">

  export type ApiaryOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    location?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    _count?: ApiaryCountOrderByAggregateInput
    _avg?: ApiaryAvgOrderByAggregateInput
    _max?: ApiaryMaxOrderByAggregateInput
    _min?: ApiaryMinOrderByAggregateInput
    _sum?: ApiarySumOrderByAggregateInput
  }

  export type ApiaryScalarWhereWithAggregatesInput = {
    AND?: ApiaryScalarWhereWithAggregatesInput | ApiaryScalarWhereWithAggregatesInput[]
    OR?: ApiaryScalarWhereWithAggregatesInput[]
    NOT?: ApiaryScalarWhereWithAggregatesInput | ApiaryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Apiary"> | string
    name?: StringWithAggregatesFilter<"Apiary"> | string
    location?: StringNullableWithAggregatesFilter<"Apiary"> | string | null
    latitude?: FloatNullableWithAggregatesFilter<"Apiary"> | number | null
    longitude?: FloatNullableWithAggregatesFilter<"Apiary"> | number | null
    notes?: StringNullableWithAggregatesFilter<"Apiary"> | string | null
  }

  export type HiveWhereInput = {
    AND?: HiveWhereInput | HiveWhereInput[]
    OR?: HiveWhereInput[]
    NOT?: HiveWhereInput | HiveWhereInput[]
    id?: StringFilter<"Hive"> | string
    name?: StringFilter<"Hive"> | string
    apiaryId?: StringNullableFilter<"Hive"> | string | null
    status?: EnumHiveStatusFilter<"Hive"> | $Enums.HiveStatus
    installationDate?: DateTimeNullableFilter<"Hive"> | Date | string | null
    apiary?: XOR<ApiaryNullableScalarRelationFilter, ApiaryWhereInput> | null
    queens?: QueenListRelationFilter
    boxes?: BoxListRelationFilter
    inspections?: InspectionListRelationFilter
  }

  export type HiveOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    apiaryId?: SortOrderInput | SortOrder
    status?: SortOrder
    installationDate?: SortOrderInput | SortOrder
    apiary?: ApiaryOrderByWithRelationInput
    queens?: QueenOrderByRelationAggregateInput
    boxes?: BoxOrderByRelationAggregateInput
    inspections?: InspectionOrderByRelationAggregateInput
  }

  export type HiveWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: HiveWhereInput | HiveWhereInput[]
    OR?: HiveWhereInput[]
    NOT?: HiveWhereInput | HiveWhereInput[]
    name?: StringFilter<"Hive"> | string
    apiaryId?: StringNullableFilter<"Hive"> | string | null
    status?: EnumHiveStatusFilter<"Hive"> | $Enums.HiveStatus
    installationDate?: DateTimeNullableFilter<"Hive"> | Date | string | null
    apiary?: XOR<ApiaryNullableScalarRelationFilter, ApiaryWhereInput> | null
    queens?: QueenListRelationFilter
    boxes?: BoxListRelationFilter
    inspections?: InspectionListRelationFilter
  }, "id">

  export type HiveOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    apiaryId?: SortOrderInput | SortOrder
    status?: SortOrder
    installationDate?: SortOrderInput | SortOrder
    _count?: HiveCountOrderByAggregateInput
    _max?: HiveMaxOrderByAggregateInput
    _min?: HiveMinOrderByAggregateInput
  }

  export type HiveScalarWhereWithAggregatesInput = {
    AND?: HiveScalarWhereWithAggregatesInput | HiveScalarWhereWithAggregatesInput[]
    OR?: HiveScalarWhereWithAggregatesInput[]
    NOT?: HiveScalarWhereWithAggregatesInput | HiveScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Hive"> | string
    name?: StringWithAggregatesFilter<"Hive"> | string
    apiaryId?: StringNullableWithAggregatesFilter<"Hive"> | string | null
    status?: EnumHiveStatusWithAggregatesFilter<"Hive"> | $Enums.HiveStatus
    installationDate?: DateTimeNullableWithAggregatesFilter<"Hive"> | Date | string | null
  }

  export type BoxWhereInput = {
    AND?: BoxWhereInput | BoxWhereInput[]
    OR?: BoxWhereInput[]
    NOT?: BoxWhereInput | BoxWhereInput[]
    id?: StringFilter<"Box"> | string
    hiveId?: StringFilter<"Box"> | string
    position?: IntFilter<"Box"> | number
    frameCount?: IntFilter<"Box"> | number
    hasExcluder?: BoolFilter<"Box"> | boolean
    type?: EnumBoxTypeFilter<"Box"> | $Enums.BoxType
    hive?: XOR<HiveScalarRelationFilter, HiveWhereInput>
  }

  export type BoxOrderByWithRelationInput = {
    id?: SortOrder
    hiveId?: SortOrder
    position?: SortOrder
    frameCount?: SortOrder
    hasExcluder?: SortOrder
    type?: SortOrder
    hive?: HiveOrderByWithRelationInput
  }

  export type BoxWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BoxWhereInput | BoxWhereInput[]
    OR?: BoxWhereInput[]
    NOT?: BoxWhereInput | BoxWhereInput[]
    hiveId?: StringFilter<"Box"> | string
    position?: IntFilter<"Box"> | number
    frameCount?: IntFilter<"Box"> | number
    hasExcluder?: BoolFilter<"Box"> | boolean
    type?: EnumBoxTypeFilter<"Box"> | $Enums.BoxType
    hive?: XOR<HiveScalarRelationFilter, HiveWhereInput>
  }, "id">

  export type BoxOrderByWithAggregationInput = {
    id?: SortOrder
    hiveId?: SortOrder
    position?: SortOrder
    frameCount?: SortOrder
    hasExcluder?: SortOrder
    type?: SortOrder
    _count?: BoxCountOrderByAggregateInput
    _avg?: BoxAvgOrderByAggregateInput
    _max?: BoxMaxOrderByAggregateInput
    _min?: BoxMinOrderByAggregateInput
    _sum?: BoxSumOrderByAggregateInput
  }

  export type BoxScalarWhereWithAggregatesInput = {
    AND?: BoxScalarWhereWithAggregatesInput | BoxScalarWhereWithAggregatesInput[]
    OR?: BoxScalarWhereWithAggregatesInput[]
    NOT?: BoxScalarWhereWithAggregatesInput | BoxScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Box"> | string
    hiveId?: StringWithAggregatesFilter<"Box"> | string
    position?: IntWithAggregatesFilter<"Box"> | number
    frameCount?: IntWithAggregatesFilter<"Box"> | number
    hasExcluder?: BoolWithAggregatesFilter<"Box"> | boolean
    type?: EnumBoxTypeWithAggregatesFilter<"Box"> | $Enums.BoxType
  }

  export type QueenWhereInput = {
    AND?: QueenWhereInput | QueenWhereInput[]
    OR?: QueenWhereInput[]
    NOT?: QueenWhereInput | QueenWhereInput[]
    id?: StringFilter<"Queen"> | string
    hiveId?: StringFilter<"Queen"> | string
    markingColor?: StringNullableFilter<"Queen"> | string | null
    year?: IntNullableFilter<"Queen"> | number | null
    source?: StringNullableFilter<"Queen"> | string | null
    status?: EnumQueenStatusFilter<"Queen"> | $Enums.QueenStatus
    installedAt?: DateTimeFilter<"Queen"> | Date | string
    replacedAt?: DateTimeNullableFilter<"Queen"> | Date | string | null
    hive?: XOR<HiveScalarRelationFilter, HiveWhereInput>
  }

  export type QueenOrderByWithRelationInput = {
    id?: SortOrder
    hiveId?: SortOrder
    markingColor?: SortOrderInput | SortOrder
    year?: SortOrderInput | SortOrder
    source?: SortOrderInput | SortOrder
    status?: SortOrder
    installedAt?: SortOrder
    replacedAt?: SortOrderInput | SortOrder
    hive?: HiveOrderByWithRelationInput
  }

  export type QueenWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: QueenWhereInput | QueenWhereInput[]
    OR?: QueenWhereInput[]
    NOT?: QueenWhereInput | QueenWhereInput[]
    hiveId?: StringFilter<"Queen"> | string
    markingColor?: StringNullableFilter<"Queen"> | string | null
    year?: IntNullableFilter<"Queen"> | number | null
    source?: StringNullableFilter<"Queen"> | string | null
    status?: EnumQueenStatusFilter<"Queen"> | $Enums.QueenStatus
    installedAt?: DateTimeFilter<"Queen"> | Date | string
    replacedAt?: DateTimeNullableFilter<"Queen"> | Date | string | null
    hive?: XOR<HiveScalarRelationFilter, HiveWhereInput>
  }, "id">

  export type QueenOrderByWithAggregationInput = {
    id?: SortOrder
    hiveId?: SortOrder
    markingColor?: SortOrderInput | SortOrder
    year?: SortOrderInput | SortOrder
    source?: SortOrderInput | SortOrder
    status?: SortOrder
    installedAt?: SortOrder
    replacedAt?: SortOrderInput | SortOrder
    _count?: QueenCountOrderByAggregateInput
    _avg?: QueenAvgOrderByAggregateInput
    _max?: QueenMaxOrderByAggregateInput
    _min?: QueenMinOrderByAggregateInput
    _sum?: QueenSumOrderByAggregateInput
  }

  export type QueenScalarWhereWithAggregatesInput = {
    AND?: QueenScalarWhereWithAggregatesInput | QueenScalarWhereWithAggregatesInput[]
    OR?: QueenScalarWhereWithAggregatesInput[]
    NOT?: QueenScalarWhereWithAggregatesInput | QueenScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Queen"> | string
    hiveId?: StringWithAggregatesFilter<"Queen"> | string
    markingColor?: StringNullableWithAggregatesFilter<"Queen"> | string | null
    year?: IntNullableWithAggregatesFilter<"Queen"> | number | null
    source?: StringNullableWithAggregatesFilter<"Queen"> | string | null
    status?: EnumQueenStatusWithAggregatesFilter<"Queen"> | $Enums.QueenStatus
    installedAt?: DateTimeWithAggregatesFilter<"Queen"> | Date | string
    replacedAt?: DateTimeNullableWithAggregatesFilter<"Queen"> | Date | string | null
  }

  export type InspectionWhereInput = {
    AND?: InspectionWhereInput | InspectionWhereInput[]
    OR?: InspectionWhereInput[]
    NOT?: InspectionWhereInput | InspectionWhereInput[]
    id?: StringFilter<"Inspection"> | string
    hiveId?: StringFilter<"Inspection"> | string
    date?: DateTimeFilter<"Inspection"> | Date | string
    weatherConditions?: StringNullableFilter<"Inspection"> | string | null
    hive?: XOR<HiveScalarRelationFilter, HiveWhereInput>
    observations?: ObservationListRelationFilter
    actions?: ActionListRelationFilter
  }

  export type InspectionOrderByWithRelationInput = {
    id?: SortOrder
    hiveId?: SortOrder
    date?: SortOrder
    weatherConditions?: SortOrderInput | SortOrder
    hive?: HiveOrderByWithRelationInput
    observations?: ObservationOrderByRelationAggregateInput
    actions?: ActionOrderByRelationAggregateInput
  }

  export type InspectionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: InspectionWhereInput | InspectionWhereInput[]
    OR?: InspectionWhereInput[]
    NOT?: InspectionWhereInput | InspectionWhereInput[]
    hiveId?: StringFilter<"Inspection"> | string
    date?: DateTimeFilter<"Inspection"> | Date | string
    weatherConditions?: StringNullableFilter<"Inspection"> | string | null
    hive?: XOR<HiveScalarRelationFilter, HiveWhereInput>
    observations?: ObservationListRelationFilter
    actions?: ActionListRelationFilter
  }, "id">

  export type InspectionOrderByWithAggregationInput = {
    id?: SortOrder
    hiveId?: SortOrder
    date?: SortOrder
    weatherConditions?: SortOrderInput | SortOrder
    _count?: InspectionCountOrderByAggregateInput
    _max?: InspectionMaxOrderByAggregateInput
    _min?: InspectionMinOrderByAggregateInput
  }

  export type InspectionScalarWhereWithAggregatesInput = {
    AND?: InspectionScalarWhereWithAggregatesInput | InspectionScalarWhereWithAggregatesInput[]
    OR?: InspectionScalarWhereWithAggregatesInput[]
    NOT?: InspectionScalarWhereWithAggregatesInput | InspectionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Inspection"> | string
    hiveId?: StringWithAggregatesFilter<"Inspection"> | string
    date?: DateTimeWithAggregatesFilter<"Inspection"> | Date | string
    weatherConditions?: StringNullableWithAggregatesFilter<"Inspection"> | string | null
  }

  export type ObservationWhereInput = {
    AND?: ObservationWhereInput | ObservationWhereInput[]
    OR?: ObservationWhereInput[]
    NOT?: ObservationWhereInput | ObservationWhereInput[]
    id?: StringFilter<"Observation"> | string
    inspectionId?: StringFilter<"Observation"> | string
    type?: StringFilter<"Observation"> | string
    numericValue?: FloatNullableFilter<"Observation"> | number | null
    textValue?: StringNullableFilter<"Observation"> | string | null
    notes?: StringNullableFilter<"Observation"> | string | null
    inspection?: XOR<InspectionScalarRelationFilter, InspectionWhereInput>
  }

  export type ObservationOrderByWithRelationInput = {
    id?: SortOrder
    inspectionId?: SortOrder
    type?: SortOrder
    numericValue?: SortOrderInput | SortOrder
    textValue?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    inspection?: InspectionOrderByWithRelationInput
  }

  export type ObservationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ObservationWhereInput | ObservationWhereInput[]
    OR?: ObservationWhereInput[]
    NOT?: ObservationWhereInput | ObservationWhereInput[]
    inspectionId?: StringFilter<"Observation"> | string
    type?: StringFilter<"Observation"> | string
    numericValue?: FloatNullableFilter<"Observation"> | number | null
    textValue?: StringNullableFilter<"Observation"> | string | null
    notes?: StringNullableFilter<"Observation"> | string | null
    inspection?: XOR<InspectionScalarRelationFilter, InspectionWhereInput>
  }, "id">

  export type ObservationOrderByWithAggregationInput = {
    id?: SortOrder
    inspectionId?: SortOrder
    type?: SortOrder
    numericValue?: SortOrderInput | SortOrder
    textValue?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    _count?: ObservationCountOrderByAggregateInput
    _avg?: ObservationAvgOrderByAggregateInput
    _max?: ObservationMaxOrderByAggregateInput
    _min?: ObservationMinOrderByAggregateInput
    _sum?: ObservationSumOrderByAggregateInput
  }

  export type ObservationScalarWhereWithAggregatesInput = {
    AND?: ObservationScalarWhereWithAggregatesInput | ObservationScalarWhereWithAggregatesInput[]
    OR?: ObservationScalarWhereWithAggregatesInput[]
    NOT?: ObservationScalarWhereWithAggregatesInput | ObservationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Observation"> | string
    inspectionId?: StringWithAggregatesFilter<"Observation"> | string
    type?: StringWithAggregatesFilter<"Observation"> | string
    numericValue?: FloatNullableWithAggregatesFilter<"Observation"> | number | null
    textValue?: StringNullableWithAggregatesFilter<"Observation"> | string | null
    notes?: StringNullableWithAggregatesFilter<"Observation"> | string | null
  }

  export type ActionWhereInput = {
    AND?: ActionWhereInput | ActionWhereInput[]
    OR?: ActionWhereInput[]
    NOT?: ActionWhereInput | ActionWhereInput[]
    id?: StringFilter<"Action"> | string
    inspectionId?: StringFilter<"Action"> | string
    type?: StringFilter<"Action"> | string
    notes?: StringNullableFilter<"Action"> | string | null
    inspection?: XOR<InspectionScalarRelationFilter, InspectionWhereInput>
  }

  export type ActionOrderByWithRelationInput = {
    id?: SortOrder
    inspectionId?: SortOrder
    type?: SortOrder
    notes?: SortOrderInput | SortOrder
    inspection?: InspectionOrderByWithRelationInput
  }

  export type ActionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ActionWhereInput | ActionWhereInput[]
    OR?: ActionWhereInput[]
    NOT?: ActionWhereInput | ActionWhereInput[]
    inspectionId?: StringFilter<"Action"> | string
    type?: StringFilter<"Action"> | string
    notes?: StringNullableFilter<"Action"> | string | null
    inspection?: XOR<InspectionScalarRelationFilter, InspectionWhereInput>
  }, "id">

  export type ActionOrderByWithAggregationInput = {
    id?: SortOrder
    inspectionId?: SortOrder
    type?: SortOrder
    notes?: SortOrderInput | SortOrder
    _count?: ActionCountOrderByAggregateInput
    _max?: ActionMaxOrderByAggregateInput
    _min?: ActionMinOrderByAggregateInput
  }

  export type ActionScalarWhereWithAggregatesInput = {
    AND?: ActionScalarWhereWithAggregatesInput | ActionScalarWhereWithAggregatesInput[]
    OR?: ActionScalarWhereWithAggregatesInput[]
    NOT?: ActionScalarWhereWithAggregatesInput | ActionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Action"> | string
    inspectionId?: StringWithAggregatesFilter<"Action"> | string
    type?: StringWithAggregatesFilter<"Action"> | string
    notes?: StringNullableWithAggregatesFilter<"Action"> | string | null
  }

  export type ApiaryCreateInput = {
    id?: string
    name: string
    location?: string | null
    latitude?: number | null
    longitude?: number | null
    notes?: string | null
    hives?: HiveCreateNestedManyWithoutApiaryInput
  }

  export type ApiaryUncheckedCreateInput = {
    id?: string
    name: string
    location?: string | null
    latitude?: number | null
    longitude?: number | null
    notes?: string | null
    hives?: HiveUncheckedCreateNestedManyWithoutApiaryInput
  }

  export type ApiaryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    location?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    hives?: HiveUpdateManyWithoutApiaryNestedInput
  }

  export type ApiaryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    location?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    hives?: HiveUncheckedUpdateManyWithoutApiaryNestedInput
  }

  export type ApiaryCreateManyInput = {
    id?: string
    name: string
    location?: string | null
    latitude?: number | null
    longitude?: number | null
    notes?: string | null
  }

  export type ApiaryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    location?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ApiaryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    location?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type HiveCreateInput = {
    id?: string
    name: string
    status?: $Enums.HiveStatus
    installationDate?: Date | string | null
    apiary?: ApiaryCreateNestedOneWithoutHivesInput
    queens?: QueenCreateNestedManyWithoutHiveInput
    boxes?: BoxCreateNestedManyWithoutHiveInput
    inspections?: InspectionCreateNestedManyWithoutHiveInput
  }

  export type HiveUncheckedCreateInput = {
    id?: string
    name: string
    apiaryId?: string | null
    status?: $Enums.HiveStatus
    installationDate?: Date | string | null
    queens?: QueenUncheckedCreateNestedManyWithoutHiveInput
    boxes?: BoxUncheckedCreateNestedManyWithoutHiveInput
    inspections?: InspectionUncheckedCreateNestedManyWithoutHiveInput
  }

  export type HiveUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumHiveStatusFieldUpdateOperationsInput | $Enums.HiveStatus
    installationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    apiary?: ApiaryUpdateOneWithoutHivesNestedInput
    queens?: QueenUpdateManyWithoutHiveNestedInput
    boxes?: BoxUpdateManyWithoutHiveNestedInput
    inspections?: InspectionUpdateManyWithoutHiveNestedInput
  }

  export type HiveUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apiaryId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumHiveStatusFieldUpdateOperationsInput | $Enums.HiveStatus
    installationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    queens?: QueenUncheckedUpdateManyWithoutHiveNestedInput
    boxes?: BoxUncheckedUpdateManyWithoutHiveNestedInput
    inspections?: InspectionUncheckedUpdateManyWithoutHiveNestedInput
  }

  export type HiveCreateManyInput = {
    id?: string
    name: string
    apiaryId?: string | null
    status?: $Enums.HiveStatus
    installationDate?: Date | string | null
  }

  export type HiveUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumHiveStatusFieldUpdateOperationsInput | $Enums.HiveStatus
    installationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type HiveUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apiaryId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumHiveStatusFieldUpdateOperationsInput | $Enums.HiveStatus
    installationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type BoxCreateInput = {
    id?: string
    position: number
    frameCount: number
    hasExcluder?: boolean
    type: $Enums.BoxType
    hive: HiveCreateNestedOneWithoutBoxesInput
  }

  export type BoxUncheckedCreateInput = {
    id?: string
    hiveId: string
    position: number
    frameCount: number
    hasExcluder?: boolean
    type: $Enums.BoxType
  }

  export type BoxUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    frameCount?: IntFieldUpdateOperationsInput | number
    hasExcluder?: BoolFieldUpdateOperationsInput | boolean
    type?: EnumBoxTypeFieldUpdateOperationsInput | $Enums.BoxType
    hive?: HiveUpdateOneRequiredWithoutBoxesNestedInput
  }

  export type BoxUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    hiveId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    frameCount?: IntFieldUpdateOperationsInput | number
    hasExcluder?: BoolFieldUpdateOperationsInput | boolean
    type?: EnumBoxTypeFieldUpdateOperationsInput | $Enums.BoxType
  }

  export type BoxCreateManyInput = {
    id?: string
    hiveId: string
    position: number
    frameCount: number
    hasExcluder?: boolean
    type: $Enums.BoxType
  }

  export type BoxUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    frameCount?: IntFieldUpdateOperationsInput | number
    hasExcluder?: BoolFieldUpdateOperationsInput | boolean
    type?: EnumBoxTypeFieldUpdateOperationsInput | $Enums.BoxType
  }

  export type BoxUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    hiveId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    frameCount?: IntFieldUpdateOperationsInput | number
    hasExcluder?: BoolFieldUpdateOperationsInput | boolean
    type?: EnumBoxTypeFieldUpdateOperationsInput | $Enums.BoxType
  }

  export type QueenCreateInput = {
    id?: string
    markingColor?: string | null
    year?: number | null
    source?: string | null
    status: $Enums.QueenStatus
    installedAt: Date | string
    replacedAt?: Date | string | null
    hive: HiveCreateNestedOneWithoutQueensInput
  }

  export type QueenUncheckedCreateInput = {
    id?: string
    hiveId: string
    markingColor?: string | null
    year?: number | null
    source?: string | null
    status: $Enums.QueenStatus
    installedAt: Date | string
    replacedAt?: Date | string | null
  }

  export type QueenUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    markingColor?: NullableStringFieldUpdateOperationsInput | string | null
    year?: NullableIntFieldUpdateOperationsInput | number | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQueenStatusFieldUpdateOperationsInput | $Enums.QueenStatus
    installedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replacedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    hive?: HiveUpdateOneRequiredWithoutQueensNestedInput
  }

  export type QueenUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    hiveId?: StringFieldUpdateOperationsInput | string
    markingColor?: NullableStringFieldUpdateOperationsInput | string | null
    year?: NullableIntFieldUpdateOperationsInput | number | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQueenStatusFieldUpdateOperationsInput | $Enums.QueenStatus
    installedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replacedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type QueenCreateManyInput = {
    id?: string
    hiveId: string
    markingColor?: string | null
    year?: number | null
    source?: string | null
    status: $Enums.QueenStatus
    installedAt: Date | string
    replacedAt?: Date | string | null
  }

  export type QueenUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    markingColor?: NullableStringFieldUpdateOperationsInput | string | null
    year?: NullableIntFieldUpdateOperationsInput | number | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQueenStatusFieldUpdateOperationsInput | $Enums.QueenStatus
    installedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replacedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type QueenUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    hiveId?: StringFieldUpdateOperationsInput | string
    markingColor?: NullableStringFieldUpdateOperationsInput | string | null
    year?: NullableIntFieldUpdateOperationsInput | number | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQueenStatusFieldUpdateOperationsInput | $Enums.QueenStatus
    installedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replacedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type InspectionCreateInput = {
    id?: string
    date: Date | string
    weatherConditions?: string | null
    hive: HiveCreateNestedOneWithoutInspectionsInput
    observations?: ObservationCreateNestedManyWithoutInspectionInput
    actions?: ActionCreateNestedManyWithoutInspectionInput
  }

  export type InspectionUncheckedCreateInput = {
    id?: string
    hiveId: string
    date: Date | string
    weatherConditions?: string | null
    observations?: ObservationUncheckedCreateNestedManyWithoutInspectionInput
    actions?: ActionUncheckedCreateNestedManyWithoutInspectionInput
  }

  export type InspectionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    weatherConditions?: NullableStringFieldUpdateOperationsInput | string | null
    hive?: HiveUpdateOneRequiredWithoutInspectionsNestedInput
    observations?: ObservationUpdateManyWithoutInspectionNestedInput
    actions?: ActionUpdateManyWithoutInspectionNestedInput
  }

  export type InspectionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    hiveId?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    weatherConditions?: NullableStringFieldUpdateOperationsInput | string | null
    observations?: ObservationUncheckedUpdateManyWithoutInspectionNestedInput
    actions?: ActionUncheckedUpdateManyWithoutInspectionNestedInput
  }

  export type InspectionCreateManyInput = {
    id?: string
    hiveId: string
    date: Date | string
    weatherConditions?: string | null
  }

  export type InspectionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    weatherConditions?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type InspectionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    hiveId?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    weatherConditions?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ObservationCreateInput = {
    id?: string
    type: string
    numericValue?: number | null
    textValue?: string | null
    notes?: string | null
    inspection: InspectionCreateNestedOneWithoutObservationsInput
  }

  export type ObservationUncheckedCreateInput = {
    id?: string
    inspectionId: string
    type: string
    numericValue?: number | null
    textValue?: string | null
    notes?: string | null
  }

  export type ObservationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    numericValue?: NullableFloatFieldUpdateOperationsInput | number | null
    textValue?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    inspection?: InspectionUpdateOneRequiredWithoutObservationsNestedInput
  }

  export type ObservationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    inspectionId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    numericValue?: NullableFloatFieldUpdateOperationsInput | number | null
    textValue?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ObservationCreateManyInput = {
    id?: string
    inspectionId: string
    type: string
    numericValue?: number | null
    textValue?: string | null
    notes?: string | null
  }

  export type ObservationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    numericValue?: NullableFloatFieldUpdateOperationsInput | number | null
    textValue?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ObservationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    inspectionId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    numericValue?: NullableFloatFieldUpdateOperationsInput | number | null
    textValue?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ActionCreateInput = {
    id?: string
    type: string
    notes?: string | null
    inspection: InspectionCreateNestedOneWithoutActionsInput
  }

  export type ActionUncheckedCreateInput = {
    id?: string
    inspectionId: string
    type: string
    notes?: string | null
  }

  export type ActionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    inspection?: InspectionUpdateOneRequiredWithoutActionsNestedInput
  }

  export type ActionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    inspectionId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ActionCreateManyInput = {
    id?: string
    inspectionId: string
    type: string
    notes?: string | null
  }

  export type ActionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ActionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    inspectionId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type HiveListRelationFilter = {
    every?: HiveWhereInput
    some?: HiveWhereInput
    none?: HiveWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type HiveOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ApiaryCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    location?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    notes?: SortOrder
  }

  export type ApiaryAvgOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type ApiaryMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    location?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    notes?: SortOrder
  }

  export type ApiaryMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    location?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    notes?: SortOrder
  }

  export type ApiarySumOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type EnumHiveStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.HiveStatus | EnumHiveStatusFieldRefInput<$PrismaModel>
    in?: $Enums.HiveStatus[] | ListEnumHiveStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.HiveStatus[] | ListEnumHiveStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumHiveStatusFilter<$PrismaModel> | $Enums.HiveStatus
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type ApiaryNullableScalarRelationFilter = {
    is?: ApiaryWhereInput | null
    isNot?: ApiaryWhereInput | null
  }

  export type QueenListRelationFilter = {
    every?: QueenWhereInput
    some?: QueenWhereInput
    none?: QueenWhereInput
  }

  export type BoxListRelationFilter = {
    every?: BoxWhereInput
    some?: BoxWhereInput
    none?: BoxWhereInput
  }

  export type InspectionListRelationFilter = {
    every?: InspectionWhereInput
    some?: InspectionWhereInput
    none?: InspectionWhereInput
  }

  export type QueenOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BoxOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type InspectionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type HiveCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    apiaryId?: SortOrder
    status?: SortOrder
    installationDate?: SortOrder
  }

  export type HiveMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    apiaryId?: SortOrder
    status?: SortOrder
    installationDate?: SortOrder
  }

  export type HiveMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    apiaryId?: SortOrder
    status?: SortOrder
    installationDate?: SortOrder
  }

  export type EnumHiveStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.HiveStatus | EnumHiveStatusFieldRefInput<$PrismaModel>
    in?: $Enums.HiveStatus[] | ListEnumHiveStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.HiveStatus[] | ListEnumHiveStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumHiveStatusWithAggregatesFilter<$PrismaModel> | $Enums.HiveStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumHiveStatusFilter<$PrismaModel>
    _max?: NestedEnumHiveStatusFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type EnumBoxTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.BoxType | EnumBoxTypeFieldRefInput<$PrismaModel>
    in?: $Enums.BoxType[] | ListEnumBoxTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.BoxType[] | ListEnumBoxTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumBoxTypeFilter<$PrismaModel> | $Enums.BoxType
  }

  export type HiveScalarRelationFilter = {
    is?: HiveWhereInput
    isNot?: HiveWhereInput
  }

  export type BoxCountOrderByAggregateInput = {
    id?: SortOrder
    hiveId?: SortOrder
    position?: SortOrder
    frameCount?: SortOrder
    hasExcluder?: SortOrder
    type?: SortOrder
  }

  export type BoxAvgOrderByAggregateInput = {
    position?: SortOrder
    frameCount?: SortOrder
  }

  export type BoxMaxOrderByAggregateInput = {
    id?: SortOrder
    hiveId?: SortOrder
    position?: SortOrder
    frameCount?: SortOrder
    hasExcluder?: SortOrder
    type?: SortOrder
  }

  export type BoxMinOrderByAggregateInput = {
    id?: SortOrder
    hiveId?: SortOrder
    position?: SortOrder
    frameCount?: SortOrder
    hasExcluder?: SortOrder
    type?: SortOrder
  }

  export type BoxSumOrderByAggregateInput = {
    position?: SortOrder
    frameCount?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumBoxTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BoxType | EnumBoxTypeFieldRefInput<$PrismaModel>
    in?: $Enums.BoxType[] | ListEnumBoxTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.BoxType[] | ListEnumBoxTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumBoxTypeWithAggregatesFilter<$PrismaModel> | $Enums.BoxType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBoxTypeFilter<$PrismaModel>
    _max?: NestedEnumBoxTypeFilter<$PrismaModel>
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type EnumQueenStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.QueenStatus | EnumQueenStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QueenStatus[] | ListEnumQueenStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.QueenStatus[] | ListEnumQueenStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumQueenStatusFilter<$PrismaModel> | $Enums.QueenStatus
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type QueenCountOrderByAggregateInput = {
    id?: SortOrder
    hiveId?: SortOrder
    markingColor?: SortOrder
    year?: SortOrder
    source?: SortOrder
    status?: SortOrder
    installedAt?: SortOrder
    replacedAt?: SortOrder
  }

  export type QueenAvgOrderByAggregateInput = {
    year?: SortOrder
  }

  export type QueenMaxOrderByAggregateInput = {
    id?: SortOrder
    hiveId?: SortOrder
    markingColor?: SortOrder
    year?: SortOrder
    source?: SortOrder
    status?: SortOrder
    installedAt?: SortOrder
    replacedAt?: SortOrder
  }

  export type QueenMinOrderByAggregateInput = {
    id?: SortOrder
    hiveId?: SortOrder
    markingColor?: SortOrder
    year?: SortOrder
    source?: SortOrder
    status?: SortOrder
    installedAt?: SortOrder
    replacedAt?: SortOrder
  }

  export type QueenSumOrderByAggregateInput = {
    year?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumQueenStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QueenStatus | EnumQueenStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QueenStatus[] | ListEnumQueenStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.QueenStatus[] | ListEnumQueenStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumQueenStatusWithAggregatesFilter<$PrismaModel> | $Enums.QueenStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQueenStatusFilter<$PrismaModel>
    _max?: NestedEnumQueenStatusFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type ObservationListRelationFilter = {
    every?: ObservationWhereInput
    some?: ObservationWhereInput
    none?: ObservationWhereInput
  }

  export type ActionListRelationFilter = {
    every?: ActionWhereInput
    some?: ActionWhereInput
    none?: ActionWhereInput
  }

  export type ObservationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ActionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type InspectionCountOrderByAggregateInput = {
    id?: SortOrder
    hiveId?: SortOrder
    date?: SortOrder
    weatherConditions?: SortOrder
  }

  export type InspectionMaxOrderByAggregateInput = {
    id?: SortOrder
    hiveId?: SortOrder
    date?: SortOrder
    weatherConditions?: SortOrder
  }

  export type InspectionMinOrderByAggregateInput = {
    id?: SortOrder
    hiveId?: SortOrder
    date?: SortOrder
    weatherConditions?: SortOrder
  }

  export type InspectionScalarRelationFilter = {
    is?: InspectionWhereInput
    isNot?: InspectionWhereInput
  }

  export type ObservationCountOrderByAggregateInput = {
    id?: SortOrder
    inspectionId?: SortOrder
    type?: SortOrder
    numericValue?: SortOrder
    textValue?: SortOrder
    notes?: SortOrder
  }

  export type ObservationAvgOrderByAggregateInput = {
    numericValue?: SortOrder
  }

  export type ObservationMaxOrderByAggregateInput = {
    id?: SortOrder
    inspectionId?: SortOrder
    type?: SortOrder
    numericValue?: SortOrder
    textValue?: SortOrder
    notes?: SortOrder
  }

  export type ObservationMinOrderByAggregateInput = {
    id?: SortOrder
    inspectionId?: SortOrder
    type?: SortOrder
    numericValue?: SortOrder
    textValue?: SortOrder
    notes?: SortOrder
  }

  export type ObservationSumOrderByAggregateInput = {
    numericValue?: SortOrder
  }

  export type ActionCountOrderByAggregateInput = {
    id?: SortOrder
    inspectionId?: SortOrder
    type?: SortOrder
    notes?: SortOrder
  }

  export type ActionMaxOrderByAggregateInput = {
    id?: SortOrder
    inspectionId?: SortOrder
    type?: SortOrder
    notes?: SortOrder
  }

  export type ActionMinOrderByAggregateInput = {
    id?: SortOrder
    inspectionId?: SortOrder
    type?: SortOrder
    notes?: SortOrder
  }

  export type HiveCreateNestedManyWithoutApiaryInput = {
    create?: XOR<HiveCreateWithoutApiaryInput, HiveUncheckedCreateWithoutApiaryInput> | HiveCreateWithoutApiaryInput[] | HiveUncheckedCreateWithoutApiaryInput[]
    connectOrCreate?: HiveCreateOrConnectWithoutApiaryInput | HiveCreateOrConnectWithoutApiaryInput[]
    createMany?: HiveCreateManyApiaryInputEnvelope
    connect?: HiveWhereUniqueInput | HiveWhereUniqueInput[]
  }

  export type HiveUncheckedCreateNestedManyWithoutApiaryInput = {
    create?: XOR<HiveCreateWithoutApiaryInput, HiveUncheckedCreateWithoutApiaryInput> | HiveCreateWithoutApiaryInput[] | HiveUncheckedCreateWithoutApiaryInput[]
    connectOrCreate?: HiveCreateOrConnectWithoutApiaryInput | HiveCreateOrConnectWithoutApiaryInput[]
    createMany?: HiveCreateManyApiaryInputEnvelope
    connect?: HiveWhereUniqueInput | HiveWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type HiveUpdateManyWithoutApiaryNestedInput = {
    create?: XOR<HiveCreateWithoutApiaryInput, HiveUncheckedCreateWithoutApiaryInput> | HiveCreateWithoutApiaryInput[] | HiveUncheckedCreateWithoutApiaryInput[]
    connectOrCreate?: HiveCreateOrConnectWithoutApiaryInput | HiveCreateOrConnectWithoutApiaryInput[]
    upsert?: HiveUpsertWithWhereUniqueWithoutApiaryInput | HiveUpsertWithWhereUniqueWithoutApiaryInput[]
    createMany?: HiveCreateManyApiaryInputEnvelope
    set?: HiveWhereUniqueInput | HiveWhereUniqueInput[]
    disconnect?: HiveWhereUniqueInput | HiveWhereUniqueInput[]
    delete?: HiveWhereUniqueInput | HiveWhereUniqueInput[]
    connect?: HiveWhereUniqueInput | HiveWhereUniqueInput[]
    update?: HiveUpdateWithWhereUniqueWithoutApiaryInput | HiveUpdateWithWhereUniqueWithoutApiaryInput[]
    updateMany?: HiveUpdateManyWithWhereWithoutApiaryInput | HiveUpdateManyWithWhereWithoutApiaryInput[]
    deleteMany?: HiveScalarWhereInput | HiveScalarWhereInput[]
  }

  export type HiveUncheckedUpdateManyWithoutApiaryNestedInput = {
    create?: XOR<HiveCreateWithoutApiaryInput, HiveUncheckedCreateWithoutApiaryInput> | HiveCreateWithoutApiaryInput[] | HiveUncheckedCreateWithoutApiaryInput[]
    connectOrCreate?: HiveCreateOrConnectWithoutApiaryInput | HiveCreateOrConnectWithoutApiaryInput[]
    upsert?: HiveUpsertWithWhereUniqueWithoutApiaryInput | HiveUpsertWithWhereUniqueWithoutApiaryInput[]
    createMany?: HiveCreateManyApiaryInputEnvelope
    set?: HiveWhereUniqueInput | HiveWhereUniqueInput[]
    disconnect?: HiveWhereUniqueInput | HiveWhereUniqueInput[]
    delete?: HiveWhereUniqueInput | HiveWhereUniqueInput[]
    connect?: HiveWhereUniqueInput | HiveWhereUniqueInput[]
    update?: HiveUpdateWithWhereUniqueWithoutApiaryInput | HiveUpdateWithWhereUniqueWithoutApiaryInput[]
    updateMany?: HiveUpdateManyWithWhereWithoutApiaryInput | HiveUpdateManyWithWhereWithoutApiaryInput[]
    deleteMany?: HiveScalarWhereInput | HiveScalarWhereInput[]
  }

  export type ApiaryCreateNestedOneWithoutHivesInput = {
    create?: XOR<ApiaryCreateWithoutHivesInput, ApiaryUncheckedCreateWithoutHivesInput>
    connectOrCreate?: ApiaryCreateOrConnectWithoutHivesInput
    connect?: ApiaryWhereUniqueInput
  }

  export type QueenCreateNestedManyWithoutHiveInput = {
    create?: XOR<QueenCreateWithoutHiveInput, QueenUncheckedCreateWithoutHiveInput> | QueenCreateWithoutHiveInput[] | QueenUncheckedCreateWithoutHiveInput[]
    connectOrCreate?: QueenCreateOrConnectWithoutHiveInput | QueenCreateOrConnectWithoutHiveInput[]
    createMany?: QueenCreateManyHiveInputEnvelope
    connect?: QueenWhereUniqueInput | QueenWhereUniqueInput[]
  }

  export type BoxCreateNestedManyWithoutHiveInput = {
    create?: XOR<BoxCreateWithoutHiveInput, BoxUncheckedCreateWithoutHiveInput> | BoxCreateWithoutHiveInput[] | BoxUncheckedCreateWithoutHiveInput[]
    connectOrCreate?: BoxCreateOrConnectWithoutHiveInput | BoxCreateOrConnectWithoutHiveInput[]
    createMany?: BoxCreateManyHiveInputEnvelope
    connect?: BoxWhereUniqueInput | BoxWhereUniqueInput[]
  }

  export type InspectionCreateNestedManyWithoutHiveInput = {
    create?: XOR<InspectionCreateWithoutHiveInput, InspectionUncheckedCreateWithoutHiveInput> | InspectionCreateWithoutHiveInput[] | InspectionUncheckedCreateWithoutHiveInput[]
    connectOrCreate?: InspectionCreateOrConnectWithoutHiveInput | InspectionCreateOrConnectWithoutHiveInput[]
    createMany?: InspectionCreateManyHiveInputEnvelope
    connect?: InspectionWhereUniqueInput | InspectionWhereUniqueInput[]
  }

  export type QueenUncheckedCreateNestedManyWithoutHiveInput = {
    create?: XOR<QueenCreateWithoutHiveInput, QueenUncheckedCreateWithoutHiveInput> | QueenCreateWithoutHiveInput[] | QueenUncheckedCreateWithoutHiveInput[]
    connectOrCreate?: QueenCreateOrConnectWithoutHiveInput | QueenCreateOrConnectWithoutHiveInput[]
    createMany?: QueenCreateManyHiveInputEnvelope
    connect?: QueenWhereUniqueInput | QueenWhereUniqueInput[]
  }

  export type BoxUncheckedCreateNestedManyWithoutHiveInput = {
    create?: XOR<BoxCreateWithoutHiveInput, BoxUncheckedCreateWithoutHiveInput> | BoxCreateWithoutHiveInput[] | BoxUncheckedCreateWithoutHiveInput[]
    connectOrCreate?: BoxCreateOrConnectWithoutHiveInput | BoxCreateOrConnectWithoutHiveInput[]
    createMany?: BoxCreateManyHiveInputEnvelope
    connect?: BoxWhereUniqueInput | BoxWhereUniqueInput[]
  }

  export type InspectionUncheckedCreateNestedManyWithoutHiveInput = {
    create?: XOR<InspectionCreateWithoutHiveInput, InspectionUncheckedCreateWithoutHiveInput> | InspectionCreateWithoutHiveInput[] | InspectionUncheckedCreateWithoutHiveInput[]
    connectOrCreate?: InspectionCreateOrConnectWithoutHiveInput | InspectionCreateOrConnectWithoutHiveInput[]
    createMany?: InspectionCreateManyHiveInputEnvelope
    connect?: InspectionWhereUniqueInput | InspectionWhereUniqueInput[]
  }

  export type EnumHiveStatusFieldUpdateOperationsInput = {
    set?: $Enums.HiveStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type ApiaryUpdateOneWithoutHivesNestedInput = {
    create?: XOR<ApiaryCreateWithoutHivesInput, ApiaryUncheckedCreateWithoutHivesInput>
    connectOrCreate?: ApiaryCreateOrConnectWithoutHivesInput
    upsert?: ApiaryUpsertWithoutHivesInput
    disconnect?: ApiaryWhereInput | boolean
    delete?: ApiaryWhereInput | boolean
    connect?: ApiaryWhereUniqueInput
    update?: XOR<XOR<ApiaryUpdateToOneWithWhereWithoutHivesInput, ApiaryUpdateWithoutHivesInput>, ApiaryUncheckedUpdateWithoutHivesInput>
  }

  export type QueenUpdateManyWithoutHiveNestedInput = {
    create?: XOR<QueenCreateWithoutHiveInput, QueenUncheckedCreateWithoutHiveInput> | QueenCreateWithoutHiveInput[] | QueenUncheckedCreateWithoutHiveInput[]
    connectOrCreate?: QueenCreateOrConnectWithoutHiveInput | QueenCreateOrConnectWithoutHiveInput[]
    upsert?: QueenUpsertWithWhereUniqueWithoutHiveInput | QueenUpsertWithWhereUniqueWithoutHiveInput[]
    createMany?: QueenCreateManyHiveInputEnvelope
    set?: QueenWhereUniqueInput | QueenWhereUniqueInput[]
    disconnect?: QueenWhereUniqueInput | QueenWhereUniqueInput[]
    delete?: QueenWhereUniqueInput | QueenWhereUniqueInput[]
    connect?: QueenWhereUniqueInput | QueenWhereUniqueInput[]
    update?: QueenUpdateWithWhereUniqueWithoutHiveInput | QueenUpdateWithWhereUniqueWithoutHiveInput[]
    updateMany?: QueenUpdateManyWithWhereWithoutHiveInput | QueenUpdateManyWithWhereWithoutHiveInput[]
    deleteMany?: QueenScalarWhereInput | QueenScalarWhereInput[]
  }

  export type BoxUpdateManyWithoutHiveNestedInput = {
    create?: XOR<BoxCreateWithoutHiveInput, BoxUncheckedCreateWithoutHiveInput> | BoxCreateWithoutHiveInput[] | BoxUncheckedCreateWithoutHiveInput[]
    connectOrCreate?: BoxCreateOrConnectWithoutHiveInput | BoxCreateOrConnectWithoutHiveInput[]
    upsert?: BoxUpsertWithWhereUniqueWithoutHiveInput | BoxUpsertWithWhereUniqueWithoutHiveInput[]
    createMany?: BoxCreateManyHiveInputEnvelope
    set?: BoxWhereUniqueInput | BoxWhereUniqueInput[]
    disconnect?: BoxWhereUniqueInput | BoxWhereUniqueInput[]
    delete?: BoxWhereUniqueInput | BoxWhereUniqueInput[]
    connect?: BoxWhereUniqueInput | BoxWhereUniqueInput[]
    update?: BoxUpdateWithWhereUniqueWithoutHiveInput | BoxUpdateWithWhereUniqueWithoutHiveInput[]
    updateMany?: BoxUpdateManyWithWhereWithoutHiveInput | BoxUpdateManyWithWhereWithoutHiveInput[]
    deleteMany?: BoxScalarWhereInput | BoxScalarWhereInput[]
  }

  export type InspectionUpdateManyWithoutHiveNestedInput = {
    create?: XOR<InspectionCreateWithoutHiveInput, InspectionUncheckedCreateWithoutHiveInput> | InspectionCreateWithoutHiveInput[] | InspectionUncheckedCreateWithoutHiveInput[]
    connectOrCreate?: InspectionCreateOrConnectWithoutHiveInput | InspectionCreateOrConnectWithoutHiveInput[]
    upsert?: InspectionUpsertWithWhereUniqueWithoutHiveInput | InspectionUpsertWithWhereUniqueWithoutHiveInput[]
    createMany?: InspectionCreateManyHiveInputEnvelope
    set?: InspectionWhereUniqueInput | InspectionWhereUniqueInput[]
    disconnect?: InspectionWhereUniqueInput | InspectionWhereUniqueInput[]
    delete?: InspectionWhereUniqueInput | InspectionWhereUniqueInput[]
    connect?: InspectionWhereUniqueInput | InspectionWhereUniqueInput[]
    update?: InspectionUpdateWithWhereUniqueWithoutHiveInput | InspectionUpdateWithWhereUniqueWithoutHiveInput[]
    updateMany?: InspectionUpdateManyWithWhereWithoutHiveInput | InspectionUpdateManyWithWhereWithoutHiveInput[]
    deleteMany?: InspectionScalarWhereInput | InspectionScalarWhereInput[]
  }

  export type QueenUncheckedUpdateManyWithoutHiveNestedInput = {
    create?: XOR<QueenCreateWithoutHiveInput, QueenUncheckedCreateWithoutHiveInput> | QueenCreateWithoutHiveInput[] | QueenUncheckedCreateWithoutHiveInput[]
    connectOrCreate?: QueenCreateOrConnectWithoutHiveInput | QueenCreateOrConnectWithoutHiveInput[]
    upsert?: QueenUpsertWithWhereUniqueWithoutHiveInput | QueenUpsertWithWhereUniqueWithoutHiveInput[]
    createMany?: QueenCreateManyHiveInputEnvelope
    set?: QueenWhereUniqueInput | QueenWhereUniqueInput[]
    disconnect?: QueenWhereUniqueInput | QueenWhereUniqueInput[]
    delete?: QueenWhereUniqueInput | QueenWhereUniqueInput[]
    connect?: QueenWhereUniqueInput | QueenWhereUniqueInput[]
    update?: QueenUpdateWithWhereUniqueWithoutHiveInput | QueenUpdateWithWhereUniqueWithoutHiveInput[]
    updateMany?: QueenUpdateManyWithWhereWithoutHiveInput | QueenUpdateManyWithWhereWithoutHiveInput[]
    deleteMany?: QueenScalarWhereInput | QueenScalarWhereInput[]
  }

  export type BoxUncheckedUpdateManyWithoutHiveNestedInput = {
    create?: XOR<BoxCreateWithoutHiveInput, BoxUncheckedCreateWithoutHiveInput> | BoxCreateWithoutHiveInput[] | BoxUncheckedCreateWithoutHiveInput[]
    connectOrCreate?: BoxCreateOrConnectWithoutHiveInput | BoxCreateOrConnectWithoutHiveInput[]
    upsert?: BoxUpsertWithWhereUniqueWithoutHiveInput | BoxUpsertWithWhereUniqueWithoutHiveInput[]
    createMany?: BoxCreateManyHiveInputEnvelope
    set?: BoxWhereUniqueInput | BoxWhereUniqueInput[]
    disconnect?: BoxWhereUniqueInput | BoxWhereUniqueInput[]
    delete?: BoxWhereUniqueInput | BoxWhereUniqueInput[]
    connect?: BoxWhereUniqueInput | BoxWhereUniqueInput[]
    update?: BoxUpdateWithWhereUniqueWithoutHiveInput | BoxUpdateWithWhereUniqueWithoutHiveInput[]
    updateMany?: BoxUpdateManyWithWhereWithoutHiveInput | BoxUpdateManyWithWhereWithoutHiveInput[]
    deleteMany?: BoxScalarWhereInput | BoxScalarWhereInput[]
  }

  export type InspectionUncheckedUpdateManyWithoutHiveNestedInput = {
    create?: XOR<InspectionCreateWithoutHiveInput, InspectionUncheckedCreateWithoutHiveInput> | InspectionCreateWithoutHiveInput[] | InspectionUncheckedCreateWithoutHiveInput[]
    connectOrCreate?: InspectionCreateOrConnectWithoutHiveInput | InspectionCreateOrConnectWithoutHiveInput[]
    upsert?: InspectionUpsertWithWhereUniqueWithoutHiveInput | InspectionUpsertWithWhereUniqueWithoutHiveInput[]
    createMany?: InspectionCreateManyHiveInputEnvelope
    set?: InspectionWhereUniqueInput | InspectionWhereUniqueInput[]
    disconnect?: InspectionWhereUniqueInput | InspectionWhereUniqueInput[]
    delete?: InspectionWhereUniqueInput | InspectionWhereUniqueInput[]
    connect?: InspectionWhereUniqueInput | InspectionWhereUniqueInput[]
    update?: InspectionUpdateWithWhereUniqueWithoutHiveInput | InspectionUpdateWithWhereUniqueWithoutHiveInput[]
    updateMany?: InspectionUpdateManyWithWhereWithoutHiveInput | InspectionUpdateManyWithWhereWithoutHiveInput[]
    deleteMany?: InspectionScalarWhereInput | InspectionScalarWhereInput[]
  }

  export type HiveCreateNestedOneWithoutBoxesInput = {
    create?: XOR<HiveCreateWithoutBoxesInput, HiveUncheckedCreateWithoutBoxesInput>
    connectOrCreate?: HiveCreateOrConnectWithoutBoxesInput
    connect?: HiveWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type EnumBoxTypeFieldUpdateOperationsInput = {
    set?: $Enums.BoxType
  }

  export type HiveUpdateOneRequiredWithoutBoxesNestedInput = {
    create?: XOR<HiveCreateWithoutBoxesInput, HiveUncheckedCreateWithoutBoxesInput>
    connectOrCreate?: HiveCreateOrConnectWithoutBoxesInput
    upsert?: HiveUpsertWithoutBoxesInput
    connect?: HiveWhereUniqueInput
    update?: XOR<XOR<HiveUpdateToOneWithWhereWithoutBoxesInput, HiveUpdateWithoutBoxesInput>, HiveUncheckedUpdateWithoutBoxesInput>
  }

  export type HiveCreateNestedOneWithoutQueensInput = {
    create?: XOR<HiveCreateWithoutQueensInput, HiveUncheckedCreateWithoutQueensInput>
    connectOrCreate?: HiveCreateOrConnectWithoutQueensInput
    connect?: HiveWhereUniqueInput
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumQueenStatusFieldUpdateOperationsInput = {
    set?: $Enums.QueenStatus
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type HiveUpdateOneRequiredWithoutQueensNestedInput = {
    create?: XOR<HiveCreateWithoutQueensInput, HiveUncheckedCreateWithoutQueensInput>
    connectOrCreate?: HiveCreateOrConnectWithoutQueensInput
    upsert?: HiveUpsertWithoutQueensInput
    connect?: HiveWhereUniqueInput
    update?: XOR<XOR<HiveUpdateToOneWithWhereWithoutQueensInput, HiveUpdateWithoutQueensInput>, HiveUncheckedUpdateWithoutQueensInput>
  }

  export type HiveCreateNestedOneWithoutInspectionsInput = {
    create?: XOR<HiveCreateWithoutInspectionsInput, HiveUncheckedCreateWithoutInspectionsInput>
    connectOrCreate?: HiveCreateOrConnectWithoutInspectionsInput
    connect?: HiveWhereUniqueInput
  }

  export type ObservationCreateNestedManyWithoutInspectionInput = {
    create?: XOR<ObservationCreateWithoutInspectionInput, ObservationUncheckedCreateWithoutInspectionInput> | ObservationCreateWithoutInspectionInput[] | ObservationUncheckedCreateWithoutInspectionInput[]
    connectOrCreate?: ObservationCreateOrConnectWithoutInspectionInput | ObservationCreateOrConnectWithoutInspectionInput[]
    createMany?: ObservationCreateManyInspectionInputEnvelope
    connect?: ObservationWhereUniqueInput | ObservationWhereUniqueInput[]
  }

  export type ActionCreateNestedManyWithoutInspectionInput = {
    create?: XOR<ActionCreateWithoutInspectionInput, ActionUncheckedCreateWithoutInspectionInput> | ActionCreateWithoutInspectionInput[] | ActionUncheckedCreateWithoutInspectionInput[]
    connectOrCreate?: ActionCreateOrConnectWithoutInspectionInput | ActionCreateOrConnectWithoutInspectionInput[]
    createMany?: ActionCreateManyInspectionInputEnvelope
    connect?: ActionWhereUniqueInput | ActionWhereUniqueInput[]
  }

  export type ObservationUncheckedCreateNestedManyWithoutInspectionInput = {
    create?: XOR<ObservationCreateWithoutInspectionInput, ObservationUncheckedCreateWithoutInspectionInput> | ObservationCreateWithoutInspectionInput[] | ObservationUncheckedCreateWithoutInspectionInput[]
    connectOrCreate?: ObservationCreateOrConnectWithoutInspectionInput | ObservationCreateOrConnectWithoutInspectionInput[]
    createMany?: ObservationCreateManyInspectionInputEnvelope
    connect?: ObservationWhereUniqueInput | ObservationWhereUniqueInput[]
  }

  export type ActionUncheckedCreateNestedManyWithoutInspectionInput = {
    create?: XOR<ActionCreateWithoutInspectionInput, ActionUncheckedCreateWithoutInspectionInput> | ActionCreateWithoutInspectionInput[] | ActionUncheckedCreateWithoutInspectionInput[]
    connectOrCreate?: ActionCreateOrConnectWithoutInspectionInput | ActionCreateOrConnectWithoutInspectionInput[]
    createMany?: ActionCreateManyInspectionInputEnvelope
    connect?: ActionWhereUniqueInput | ActionWhereUniqueInput[]
  }

  export type HiveUpdateOneRequiredWithoutInspectionsNestedInput = {
    create?: XOR<HiveCreateWithoutInspectionsInput, HiveUncheckedCreateWithoutInspectionsInput>
    connectOrCreate?: HiveCreateOrConnectWithoutInspectionsInput
    upsert?: HiveUpsertWithoutInspectionsInput
    connect?: HiveWhereUniqueInput
    update?: XOR<XOR<HiveUpdateToOneWithWhereWithoutInspectionsInput, HiveUpdateWithoutInspectionsInput>, HiveUncheckedUpdateWithoutInspectionsInput>
  }

  export type ObservationUpdateManyWithoutInspectionNestedInput = {
    create?: XOR<ObservationCreateWithoutInspectionInput, ObservationUncheckedCreateWithoutInspectionInput> | ObservationCreateWithoutInspectionInput[] | ObservationUncheckedCreateWithoutInspectionInput[]
    connectOrCreate?: ObservationCreateOrConnectWithoutInspectionInput | ObservationCreateOrConnectWithoutInspectionInput[]
    upsert?: ObservationUpsertWithWhereUniqueWithoutInspectionInput | ObservationUpsertWithWhereUniqueWithoutInspectionInput[]
    createMany?: ObservationCreateManyInspectionInputEnvelope
    set?: ObservationWhereUniqueInput | ObservationWhereUniqueInput[]
    disconnect?: ObservationWhereUniqueInput | ObservationWhereUniqueInput[]
    delete?: ObservationWhereUniqueInput | ObservationWhereUniqueInput[]
    connect?: ObservationWhereUniqueInput | ObservationWhereUniqueInput[]
    update?: ObservationUpdateWithWhereUniqueWithoutInspectionInput | ObservationUpdateWithWhereUniqueWithoutInspectionInput[]
    updateMany?: ObservationUpdateManyWithWhereWithoutInspectionInput | ObservationUpdateManyWithWhereWithoutInspectionInput[]
    deleteMany?: ObservationScalarWhereInput | ObservationScalarWhereInput[]
  }

  export type ActionUpdateManyWithoutInspectionNestedInput = {
    create?: XOR<ActionCreateWithoutInspectionInput, ActionUncheckedCreateWithoutInspectionInput> | ActionCreateWithoutInspectionInput[] | ActionUncheckedCreateWithoutInspectionInput[]
    connectOrCreate?: ActionCreateOrConnectWithoutInspectionInput | ActionCreateOrConnectWithoutInspectionInput[]
    upsert?: ActionUpsertWithWhereUniqueWithoutInspectionInput | ActionUpsertWithWhereUniqueWithoutInspectionInput[]
    createMany?: ActionCreateManyInspectionInputEnvelope
    set?: ActionWhereUniqueInput | ActionWhereUniqueInput[]
    disconnect?: ActionWhereUniqueInput | ActionWhereUniqueInput[]
    delete?: ActionWhereUniqueInput | ActionWhereUniqueInput[]
    connect?: ActionWhereUniqueInput | ActionWhereUniqueInput[]
    update?: ActionUpdateWithWhereUniqueWithoutInspectionInput | ActionUpdateWithWhereUniqueWithoutInspectionInput[]
    updateMany?: ActionUpdateManyWithWhereWithoutInspectionInput | ActionUpdateManyWithWhereWithoutInspectionInput[]
    deleteMany?: ActionScalarWhereInput | ActionScalarWhereInput[]
  }

  export type ObservationUncheckedUpdateManyWithoutInspectionNestedInput = {
    create?: XOR<ObservationCreateWithoutInspectionInput, ObservationUncheckedCreateWithoutInspectionInput> | ObservationCreateWithoutInspectionInput[] | ObservationUncheckedCreateWithoutInspectionInput[]
    connectOrCreate?: ObservationCreateOrConnectWithoutInspectionInput | ObservationCreateOrConnectWithoutInspectionInput[]
    upsert?: ObservationUpsertWithWhereUniqueWithoutInspectionInput | ObservationUpsertWithWhereUniqueWithoutInspectionInput[]
    createMany?: ObservationCreateManyInspectionInputEnvelope
    set?: ObservationWhereUniqueInput | ObservationWhereUniqueInput[]
    disconnect?: ObservationWhereUniqueInput | ObservationWhereUniqueInput[]
    delete?: ObservationWhereUniqueInput | ObservationWhereUniqueInput[]
    connect?: ObservationWhereUniqueInput | ObservationWhereUniqueInput[]
    update?: ObservationUpdateWithWhereUniqueWithoutInspectionInput | ObservationUpdateWithWhereUniqueWithoutInspectionInput[]
    updateMany?: ObservationUpdateManyWithWhereWithoutInspectionInput | ObservationUpdateManyWithWhereWithoutInspectionInput[]
    deleteMany?: ObservationScalarWhereInput | ObservationScalarWhereInput[]
  }

  export type ActionUncheckedUpdateManyWithoutInspectionNestedInput = {
    create?: XOR<ActionCreateWithoutInspectionInput, ActionUncheckedCreateWithoutInspectionInput> | ActionCreateWithoutInspectionInput[] | ActionUncheckedCreateWithoutInspectionInput[]
    connectOrCreate?: ActionCreateOrConnectWithoutInspectionInput | ActionCreateOrConnectWithoutInspectionInput[]
    upsert?: ActionUpsertWithWhereUniqueWithoutInspectionInput | ActionUpsertWithWhereUniqueWithoutInspectionInput[]
    createMany?: ActionCreateManyInspectionInputEnvelope
    set?: ActionWhereUniqueInput | ActionWhereUniqueInput[]
    disconnect?: ActionWhereUniqueInput | ActionWhereUniqueInput[]
    delete?: ActionWhereUniqueInput | ActionWhereUniqueInput[]
    connect?: ActionWhereUniqueInput | ActionWhereUniqueInput[]
    update?: ActionUpdateWithWhereUniqueWithoutInspectionInput | ActionUpdateWithWhereUniqueWithoutInspectionInput[]
    updateMany?: ActionUpdateManyWithWhereWithoutInspectionInput | ActionUpdateManyWithWhereWithoutInspectionInput[]
    deleteMany?: ActionScalarWhereInput | ActionScalarWhereInput[]
  }

  export type InspectionCreateNestedOneWithoutObservationsInput = {
    create?: XOR<InspectionCreateWithoutObservationsInput, InspectionUncheckedCreateWithoutObservationsInput>
    connectOrCreate?: InspectionCreateOrConnectWithoutObservationsInput
    connect?: InspectionWhereUniqueInput
  }

  export type InspectionUpdateOneRequiredWithoutObservationsNestedInput = {
    create?: XOR<InspectionCreateWithoutObservationsInput, InspectionUncheckedCreateWithoutObservationsInput>
    connectOrCreate?: InspectionCreateOrConnectWithoutObservationsInput
    upsert?: InspectionUpsertWithoutObservationsInput
    connect?: InspectionWhereUniqueInput
    update?: XOR<XOR<InspectionUpdateToOneWithWhereWithoutObservationsInput, InspectionUpdateWithoutObservationsInput>, InspectionUncheckedUpdateWithoutObservationsInput>
  }

  export type InspectionCreateNestedOneWithoutActionsInput = {
    create?: XOR<InspectionCreateWithoutActionsInput, InspectionUncheckedCreateWithoutActionsInput>
    connectOrCreate?: InspectionCreateOrConnectWithoutActionsInput
    connect?: InspectionWhereUniqueInput
  }

  export type InspectionUpdateOneRequiredWithoutActionsNestedInput = {
    create?: XOR<InspectionCreateWithoutActionsInput, InspectionUncheckedCreateWithoutActionsInput>
    connectOrCreate?: InspectionCreateOrConnectWithoutActionsInput
    upsert?: InspectionUpsertWithoutActionsInput
    connect?: InspectionWhereUniqueInput
    update?: XOR<XOR<InspectionUpdateToOneWithWhereWithoutActionsInput, InspectionUpdateWithoutActionsInput>, InspectionUncheckedUpdateWithoutActionsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedEnumHiveStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.HiveStatus | EnumHiveStatusFieldRefInput<$PrismaModel>
    in?: $Enums.HiveStatus[] | ListEnumHiveStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.HiveStatus[] | ListEnumHiveStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumHiveStatusFilter<$PrismaModel> | $Enums.HiveStatus
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedEnumHiveStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.HiveStatus | EnumHiveStatusFieldRefInput<$PrismaModel>
    in?: $Enums.HiveStatus[] | ListEnumHiveStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.HiveStatus[] | ListEnumHiveStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumHiveStatusWithAggregatesFilter<$PrismaModel> | $Enums.HiveStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumHiveStatusFilter<$PrismaModel>
    _max?: NestedEnumHiveStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumBoxTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.BoxType | EnumBoxTypeFieldRefInput<$PrismaModel>
    in?: $Enums.BoxType[] | ListEnumBoxTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.BoxType[] | ListEnumBoxTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumBoxTypeFilter<$PrismaModel> | $Enums.BoxType
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumBoxTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BoxType | EnumBoxTypeFieldRefInput<$PrismaModel>
    in?: $Enums.BoxType[] | ListEnumBoxTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.BoxType[] | ListEnumBoxTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumBoxTypeWithAggregatesFilter<$PrismaModel> | $Enums.BoxType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBoxTypeFilter<$PrismaModel>
    _max?: NestedEnumBoxTypeFilter<$PrismaModel>
  }

  export type NestedEnumQueenStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.QueenStatus | EnumQueenStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QueenStatus[] | ListEnumQueenStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.QueenStatus[] | ListEnumQueenStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumQueenStatusFilter<$PrismaModel> | $Enums.QueenStatus
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedEnumQueenStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QueenStatus | EnumQueenStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QueenStatus[] | ListEnumQueenStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.QueenStatus[] | ListEnumQueenStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumQueenStatusWithAggregatesFilter<$PrismaModel> | $Enums.QueenStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQueenStatusFilter<$PrismaModel>
    _max?: NestedEnumQueenStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type HiveCreateWithoutApiaryInput = {
    id?: string
    name: string
    status?: $Enums.HiveStatus
    installationDate?: Date | string | null
    queens?: QueenCreateNestedManyWithoutHiveInput
    boxes?: BoxCreateNestedManyWithoutHiveInput
    inspections?: InspectionCreateNestedManyWithoutHiveInput
  }

  export type HiveUncheckedCreateWithoutApiaryInput = {
    id?: string
    name: string
    status?: $Enums.HiveStatus
    installationDate?: Date | string | null
    queens?: QueenUncheckedCreateNestedManyWithoutHiveInput
    boxes?: BoxUncheckedCreateNestedManyWithoutHiveInput
    inspections?: InspectionUncheckedCreateNestedManyWithoutHiveInput
  }

  export type HiveCreateOrConnectWithoutApiaryInput = {
    where: HiveWhereUniqueInput
    create: XOR<HiveCreateWithoutApiaryInput, HiveUncheckedCreateWithoutApiaryInput>
  }

  export type HiveCreateManyApiaryInputEnvelope = {
    data: HiveCreateManyApiaryInput | HiveCreateManyApiaryInput[]
    skipDuplicates?: boolean
  }

  export type HiveUpsertWithWhereUniqueWithoutApiaryInput = {
    where: HiveWhereUniqueInput
    update: XOR<HiveUpdateWithoutApiaryInput, HiveUncheckedUpdateWithoutApiaryInput>
    create: XOR<HiveCreateWithoutApiaryInput, HiveUncheckedCreateWithoutApiaryInput>
  }

  export type HiveUpdateWithWhereUniqueWithoutApiaryInput = {
    where: HiveWhereUniqueInput
    data: XOR<HiveUpdateWithoutApiaryInput, HiveUncheckedUpdateWithoutApiaryInput>
  }

  export type HiveUpdateManyWithWhereWithoutApiaryInput = {
    where: HiveScalarWhereInput
    data: XOR<HiveUpdateManyMutationInput, HiveUncheckedUpdateManyWithoutApiaryInput>
  }

  export type HiveScalarWhereInput = {
    AND?: HiveScalarWhereInput | HiveScalarWhereInput[]
    OR?: HiveScalarWhereInput[]
    NOT?: HiveScalarWhereInput | HiveScalarWhereInput[]
    id?: StringFilter<"Hive"> | string
    name?: StringFilter<"Hive"> | string
    apiaryId?: StringNullableFilter<"Hive"> | string | null
    status?: EnumHiveStatusFilter<"Hive"> | $Enums.HiveStatus
    installationDate?: DateTimeNullableFilter<"Hive"> | Date | string | null
  }

  export type ApiaryCreateWithoutHivesInput = {
    id?: string
    name: string
    location?: string | null
    latitude?: number | null
    longitude?: number | null
    notes?: string | null
  }

  export type ApiaryUncheckedCreateWithoutHivesInput = {
    id?: string
    name: string
    location?: string | null
    latitude?: number | null
    longitude?: number | null
    notes?: string | null
  }

  export type ApiaryCreateOrConnectWithoutHivesInput = {
    where: ApiaryWhereUniqueInput
    create: XOR<ApiaryCreateWithoutHivesInput, ApiaryUncheckedCreateWithoutHivesInput>
  }

  export type QueenCreateWithoutHiveInput = {
    id?: string
    markingColor?: string | null
    year?: number | null
    source?: string | null
    status: $Enums.QueenStatus
    installedAt: Date | string
    replacedAt?: Date | string | null
  }

  export type QueenUncheckedCreateWithoutHiveInput = {
    id?: string
    markingColor?: string | null
    year?: number | null
    source?: string | null
    status: $Enums.QueenStatus
    installedAt: Date | string
    replacedAt?: Date | string | null
  }

  export type QueenCreateOrConnectWithoutHiveInput = {
    where: QueenWhereUniqueInput
    create: XOR<QueenCreateWithoutHiveInput, QueenUncheckedCreateWithoutHiveInput>
  }

  export type QueenCreateManyHiveInputEnvelope = {
    data: QueenCreateManyHiveInput | QueenCreateManyHiveInput[]
    skipDuplicates?: boolean
  }

  export type BoxCreateWithoutHiveInput = {
    id?: string
    position: number
    frameCount: number
    hasExcluder?: boolean
    type: $Enums.BoxType
  }

  export type BoxUncheckedCreateWithoutHiveInput = {
    id?: string
    position: number
    frameCount: number
    hasExcluder?: boolean
    type: $Enums.BoxType
  }

  export type BoxCreateOrConnectWithoutHiveInput = {
    where: BoxWhereUniqueInput
    create: XOR<BoxCreateWithoutHiveInput, BoxUncheckedCreateWithoutHiveInput>
  }

  export type BoxCreateManyHiveInputEnvelope = {
    data: BoxCreateManyHiveInput | BoxCreateManyHiveInput[]
    skipDuplicates?: boolean
  }

  export type InspectionCreateWithoutHiveInput = {
    id?: string
    date: Date | string
    weatherConditions?: string | null
    observations?: ObservationCreateNestedManyWithoutInspectionInput
    actions?: ActionCreateNestedManyWithoutInspectionInput
  }

  export type InspectionUncheckedCreateWithoutHiveInput = {
    id?: string
    date: Date | string
    weatherConditions?: string | null
    observations?: ObservationUncheckedCreateNestedManyWithoutInspectionInput
    actions?: ActionUncheckedCreateNestedManyWithoutInspectionInput
  }

  export type InspectionCreateOrConnectWithoutHiveInput = {
    where: InspectionWhereUniqueInput
    create: XOR<InspectionCreateWithoutHiveInput, InspectionUncheckedCreateWithoutHiveInput>
  }

  export type InspectionCreateManyHiveInputEnvelope = {
    data: InspectionCreateManyHiveInput | InspectionCreateManyHiveInput[]
    skipDuplicates?: boolean
  }

  export type ApiaryUpsertWithoutHivesInput = {
    update: XOR<ApiaryUpdateWithoutHivesInput, ApiaryUncheckedUpdateWithoutHivesInput>
    create: XOR<ApiaryCreateWithoutHivesInput, ApiaryUncheckedCreateWithoutHivesInput>
    where?: ApiaryWhereInput
  }

  export type ApiaryUpdateToOneWithWhereWithoutHivesInput = {
    where?: ApiaryWhereInput
    data: XOR<ApiaryUpdateWithoutHivesInput, ApiaryUncheckedUpdateWithoutHivesInput>
  }

  export type ApiaryUpdateWithoutHivesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    location?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ApiaryUncheckedUpdateWithoutHivesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    location?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type QueenUpsertWithWhereUniqueWithoutHiveInput = {
    where: QueenWhereUniqueInput
    update: XOR<QueenUpdateWithoutHiveInput, QueenUncheckedUpdateWithoutHiveInput>
    create: XOR<QueenCreateWithoutHiveInput, QueenUncheckedCreateWithoutHiveInput>
  }

  export type QueenUpdateWithWhereUniqueWithoutHiveInput = {
    where: QueenWhereUniqueInput
    data: XOR<QueenUpdateWithoutHiveInput, QueenUncheckedUpdateWithoutHiveInput>
  }

  export type QueenUpdateManyWithWhereWithoutHiveInput = {
    where: QueenScalarWhereInput
    data: XOR<QueenUpdateManyMutationInput, QueenUncheckedUpdateManyWithoutHiveInput>
  }

  export type QueenScalarWhereInput = {
    AND?: QueenScalarWhereInput | QueenScalarWhereInput[]
    OR?: QueenScalarWhereInput[]
    NOT?: QueenScalarWhereInput | QueenScalarWhereInput[]
    id?: StringFilter<"Queen"> | string
    hiveId?: StringFilter<"Queen"> | string
    markingColor?: StringNullableFilter<"Queen"> | string | null
    year?: IntNullableFilter<"Queen"> | number | null
    source?: StringNullableFilter<"Queen"> | string | null
    status?: EnumQueenStatusFilter<"Queen"> | $Enums.QueenStatus
    installedAt?: DateTimeFilter<"Queen"> | Date | string
    replacedAt?: DateTimeNullableFilter<"Queen"> | Date | string | null
  }

  export type BoxUpsertWithWhereUniqueWithoutHiveInput = {
    where: BoxWhereUniqueInput
    update: XOR<BoxUpdateWithoutHiveInput, BoxUncheckedUpdateWithoutHiveInput>
    create: XOR<BoxCreateWithoutHiveInput, BoxUncheckedCreateWithoutHiveInput>
  }

  export type BoxUpdateWithWhereUniqueWithoutHiveInput = {
    where: BoxWhereUniqueInput
    data: XOR<BoxUpdateWithoutHiveInput, BoxUncheckedUpdateWithoutHiveInput>
  }

  export type BoxUpdateManyWithWhereWithoutHiveInput = {
    where: BoxScalarWhereInput
    data: XOR<BoxUpdateManyMutationInput, BoxUncheckedUpdateManyWithoutHiveInput>
  }

  export type BoxScalarWhereInput = {
    AND?: BoxScalarWhereInput | BoxScalarWhereInput[]
    OR?: BoxScalarWhereInput[]
    NOT?: BoxScalarWhereInput | BoxScalarWhereInput[]
    id?: StringFilter<"Box"> | string
    hiveId?: StringFilter<"Box"> | string
    position?: IntFilter<"Box"> | number
    frameCount?: IntFilter<"Box"> | number
    hasExcluder?: BoolFilter<"Box"> | boolean
    type?: EnumBoxTypeFilter<"Box"> | $Enums.BoxType
  }

  export type InspectionUpsertWithWhereUniqueWithoutHiveInput = {
    where: InspectionWhereUniqueInput
    update: XOR<InspectionUpdateWithoutHiveInput, InspectionUncheckedUpdateWithoutHiveInput>
    create: XOR<InspectionCreateWithoutHiveInput, InspectionUncheckedCreateWithoutHiveInput>
  }

  export type InspectionUpdateWithWhereUniqueWithoutHiveInput = {
    where: InspectionWhereUniqueInput
    data: XOR<InspectionUpdateWithoutHiveInput, InspectionUncheckedUpdateWithoutHiveInput>
  }

  export type InspectionUpdateManyWithWhereWithoutHiveInput = {
    where: InspectionScalarWhereInput
    data: XOR<InspectionUpdateManyMutationInput, InspectionUncheckedUpdateManyWithoutHiveInput>
  }

  export type InspectionScalarWhereInput = {
    AND?: InspectionScalarWhereInput | InspectionScalarWhereInput[]
    OR?: InspectionScalarWhereInput[]
    NOT?: InspectionScalarWhereInput | InspectionScalarWhereInput[]
    id?: StringFilter<"Inspection"> | string
    hiveId?: StringFilter<"Inspection"> | string
    date?: DateTimeFilter<"Inspection"> | Date | string
    weatherConditions?: StringNullableFilter<"Inspection"> | string | null
  }

  export type HiveCreateWithoutBoxesInput = {
    id?: string
    name: string
    status?: $Enums.HiveStatus
    installationDate?: Date | string | null
    apiary?: ApiaryCreateNestedOneWithoutHivesInput
    queens?: QueenCreateNestedManyWithoutHiveInput
    inspections?: InspectionCreateNestedManyWithoutHiveInput
  }

  export type HiveUncheckedCreateWithoutBoxesInput = {
    id?: string
    name: string
    apiaryId?: string | null
    status?: $Enums.HiveStatus
    installationDate?: Date | string | null
    queens?: QueenUncheckedCreateNestedManyWithoutHiveInput
    inspections?: InspectionUncheckedCreateNestedManyWithoutHiveInput
  }

  export type HiveCreateOrConnectWithoutBoxesInput = {
    where: HiveWhereUniqueInput
    create: XOR<HiveCreateWithoutBoxesInput, HiveUncheckedCreateWithoutBoxesInput>
  }

  export type HiveUpsertWithoutBoxesInput = {
    update: XOR<HiveUpdateWithoutBoxesInput, HiveUncheckedUpdateWithoutBoxesInput>
    create: XOR<HiveCreateWithoutBoxesInput, HiveUncheckedCreateWithoutBoxesInput>
    where?: HiveWhereInput
  }

  export type HiveUpdateToOneWithWhereWithoutBoxesInput = {
    where?: HiveWhereInput
    data: XOR<HiveUpdateWithoutBoxesInput, HiveUncheckedUpdateWithoutBoxesInput>
  }

  export type HiveUpdateWithoutBoxesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumHiveStatusFieldUpdateOperationsInput | $Enums.HiveStatus
    installationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    apiary?: ApiaryUpdateOneWithoutHivesNestedInput
    queens?: QueenUpdateManyWithoutHiveNestedInput
    inspections?: InspectionUpdateManyWithoutHiveNestedInput
  }

  export type HiveUncheckedUpdateWithoutBoxesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apiaryId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumHiveStatusFieldUpdateOperationsInput | $Enums.HiveStatus
    installationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    queens?: QueenUncheckedUpdateManyWithoutHiveNestedInput
    inspections?: InspectionUncheckedUpdateManyWithoutHiveNestedInput
  }

  export type HiveCreateWithoutQueensInput = {
    id?: string
    name: string
    status?: $Enums.HiveStatus
    installationDate?: Date | string | null
    apiary?: ApiaryCreateNestedOneWithoutHivesInput
    boxes?: BoxCreateNestedManyWithoutHiveInput
    inspections?: InspectionCreateNestedManyWithoutHiveInput
  }

  export type HiveUncheckedCreateWithoutQueensInput = {
    id?: string
    name: string
    apiaryId?: string | null
    status?: $Enums.HiveStatus
    installationDate?: Date | string | null
    boxes?: BoxUncheckedCreateNestedManyWithoutHiveInput
    inspections?: InspectionUncheckedCreateNestedManyWithoutHiveInput
  }

  export type HiveCreateOrConnectWithoutQueensInput = {
    where: HiveWhereUniqueInput
    create: XOR<HiveCreateWithoutQueensInput, HiveUncheckedCreateWithoutQueensInput>
  }

  export type HiveUpsertWithoutQueensInput = {
    update: XOR<HiveUpdateWithoutQueensInput, HiveUncheckedUpdateWithoutQueensInput>
    create: XOR<HiveCreateWithoutQueensInput, HiveUncheckedCreateWithoutQueensInput>
    where?: HiveWhereInput
  }

  export type HiveUpdateToOneWithWhereWithoutQueensInput = {
    where?: HiveWhereInput
    data: XOR<HiveUpdateWithoutQueensInput, HiveUncheckedUpdateWithoutQueensInput>
  }

  export type HiveUpdateWithoutQueensInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumHiveStatusFieldUpdateOperationsInput | $Enums.HiveStatus
    installationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    apiary?: ApiaryUpdateOneWithoutHivesNestedInput
    boxes?: BoxUpdateManyWithoutHiveNestedInput
    inspections?: InspectionUpdateManyWithoutHiveNestedInput
  }

  export type HiveUncheckedUpdateWithoutQueensInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apiaryId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumHiveStatusFieldUpdateOperationsInput | $Enums.HiveStatus
    installationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    boxes?: BoxUncheckedUpdateManyWithoutHiveNestedInput
    inspections?: InspectionUncheckedUpdateManyWithoutHiveNestedInput
  }

  export type HiveCreateWithoutInspectionsInput = {
    id?: string
    name: string
    status?: $Enums.HiveStatus
    installationDate?: Date | string | null
    apiary?: ApiaryCreateNestedOneWithoutHivesInput
    queens?: QueenCreateNestedManyWithoutHiveInput
    boxes?: BoxCreateNestedManyWithoutHiveInput
  }

  export type HiveUncheckedCreateWithoutInspectionsInput = {
    id?: string
    name: string
    apiaryId?: string | null
    status?: $Enums.HiveStatus
    installationDate?: Date | string | null
    queens?: QueenUncheckedCreateNestedManyWithoutHiveInput
    boxes?: BoxUncheckedCreateNestedManyWithoutHiveInput
  }

  export type HiveCreateOrConnectWithoutInspectionsInput = {
    where: HiveWhereUniqueInput
    create: XOR<HiveCreateWithoutInspectionsInput, HiveUncheckedCreateWithoutInspectionsInput>
  }

  export type ObservationCreateWithoutInspectionInput = {
    id?: string
    type: string
    numericValue?: number | null
    textValue?: string | null
    notes?: string | null
  }

  export type ObservationUncheckedCreateWithoutInspectionInput = {
    id?: string
    type: string
    numericValue?: number | null
    textValue?: string | null
    notes?: string | null
  }

  export type ObservationCreateOrConnectWithoutInspectionInput = {
    where: ObservationWhereUniqueInput
    create: XOR<ObservationCreateWithoutInspectionInput, ObservationUncheckedCreateWithoutInspectionInput>
  }

  export type ObservationCreateManyInspectionInputEnvelope = {
    data: ObservationCreateManyInspectionInput | ObservationCreateManyInspectionInput[]
    skipDuplicates?: boolean
  }

  export type ActionCreateWithoutInspectionInput = {
    id?: string
    type: string
    notes?: string | null
  }

  export type ActionUncheckedCreateWithoutInspectionInput = {
    id?: string
    type: string
    notes?: string | null
  }

  export type ActionCreateOrConnectWithoutInspectionInput = {
    where: ActionWhereUniqueInput
    create: XOR<ActionCreateWithoutInspectionInput, ActionUncheckedCreateWithoutInspectionInput>
  }

  export type ActionCreateManyInspectionInputEnvelope = {
    data: ActionCreateManyInspectionInput | ActionCreateManyInspectionInput[]
    skipDuplicates?: boolean
  }

  export type HiveUpsertWithoutInspectionsInput = {
    update: XOR<HiveUpdateWithoutInspectionsInput, HiveUncheckedUpdateWithoutInspectionsInput>
    create: XOR<HiveCreateWithoutInspectionsInput, HiveUncheckedCreateWithoutInspectionsInput>
    where?: HiveWhereInput
  }

  export type HiveUpdateToOneWithWhereWithoutInspectionsInput = {
    where?: HiveWhereInput
    data: XOR<HiveUpdateWithoutInspectionsInput, HiveUncheckedUpdateWithoutInspectionsInput>
  }

  export type HiveUpdateWithoutInspectionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumHiveStatusFieldUpdateOperationsInput | $Enums.HiveStatus
    installationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    apiary?: ApiaryUpdateOneWithoutHivesNestedInput
    queens?: QueenUpdateManyWithoutHiveNestedInput
    boxes?: BoxUpdateManyWithoutHiveNestedInput
  }

  export type HiveUncheckedUpdateWithoutInspectionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apiaryId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumHiveStatusFieldUpdateOperationsInput | $Enums.HiveStatus
    installationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    queens?: QueenUncheckedUpdateManyWithoutHiveNestedInput
    boxes?: BoxUncheckedUpdateManyWithoutHiveNestedInput
  }

  export type ObservationUpsertWithWhereUniqueWithoutInspectionInput = {
    where: ObservationWhereUniqueInput
    update: XOR<ObservationUpdateWithoutInspectionInput, ObservationUncheckedUpdateWithoutInspectionInput>
    create: XOR<ObservationCreateWithoutInspectionInput, ObservationUncheckedCreateWithoutInspectionInput>
  }

  export type ObservationUpdateWithWhereUniqueWithoutInspectionInput = {
    where: ObservationWhereUniqueInput
    data: XOR<ObservationUpdateWithoutInspectionInput, ObservationUncheckedUpdateWithoutInspectionInput>
  }

  export type ObservationUpdateManyWithWhereWithoutInspectionInput = {
    where: ObservationScalarWhereInput
    data: XOR<ObservationUpdateManyMutationInput, ObservationUncheckedUpdateManyWithoutInspectionInput>
  }

  export type ObservationScalarWhereInput = {
    AND?: ObservationScalarWhereInput | ObservationScalarWhereInput[]
    OR?: ObservationScalarWhereInput[]
    NOT?: ObservationScalarWhereInput | ObservationScalarWhereInput[]
    id?: StringFilter<"Observation"> | string
    inspectionId?: StringFilter<"Observation"> | string
    type?: StringFilter<"Observation"> | string
    numericValue?: FloatNullableFilter<"Observation"> | number | null
    textValue?: StringNullableFilter<"Observation"> | string | null
    notes?: StringNullableFilter<"Observation"> | string | null
  }

  export type ActionUpsertWithWhereUniqueWithoutInspectionInput = {
    where: ActionWhereUniqueInput
    update: XOR<ActionUpdateWithoutInspectionInput, ActionUncheckedUpdateWithoutInspectionInput>
    create: XOR<ActionCreateWithoutInspectionInput, ActionUncheckedCreateWithoutInspectionInput>
  }

  export type ActionUpdateWithWhereUniqueWithoutInspectionInput = {
    where: ActionWhereUniqueInput
    data: XOR<ActionUpdateWithoutInspectionInput, ActionUncheckedUpdateWithoutInspectionInput>
  }

  export type ActionUpdateManyWithWhereWithoutInspectionInput = {
    where: ActionScalarWhereInput
    data: XOR<ActionUpdateManyMutationInput, ActionUncheckedUpdateManyWithoutInspectionInput>
  }

  export type ActionScalarWhereInput = {
    AND?: ActionScalarWhereInput | ActionScalarWhereInput[]
    OR?: ActionScalarWhereInput[]
    NOT?: ActionScalarWhereInput | ActionScalarWhereInput[]
    id?: StringFilter<"Action"> | string
    inspectionId?: StringFilter<"Action"> | string
    type?: StringFilter<"Action"> | string
    notes?: StringNullableFilter<"Action"> | string | null
  }

  export type InspectionCreateWithoutObservationsInput = {
    id?: string
    date: Date | string
    weatherConditions?: string | null
    hive: HiveCreateNestedOneWithoutInspectionsInput
    actions?: ActionCreateNestedManyWithoutInspectionInput
  }

  export type InspectionUncheckedCreateWithoutObservationsInput = {
    id?: string
    hiveId: string
    date: Date | string
    weatherConditions?: string | null
    actions?: ActionUncheckedCreateNestedManyWithoutInspectionInput
  }

  export type InspectionCreateOrConnectWithoutObservationsInput = {
    where: InspectionWhereUniqueInput
    create: XOR<InspectionCreateWithoutObservationsInput, InspectionUncheckedCreateWithoutObservationsInput>
  }

  export type InspectionUpsertWithoutObservationsInput = {
    update: XOR<InspectionUpdateWithoutObservationsInput, InspectionUncheckedUpdateWithoutObservationsInput>
    create: XOR<InspectionCreateWithoutObservationsInput, InspectionUncheckedCreateWithoutObservationsInput>
    where?: InspectionWhereInput
  }

  export type InspectionUpdateToOneWithWhereWithoutObservationsInput = {
    where?: InspectionWhereInput
    data: XOR<InspectionUpdateWithoutObservationsInput, InspectionUncheckedUpdateWithoutObservationsInput>
  }

  export type InspectionUpdateWithoutObservationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    weatherConditions?: NullableStringFieldUpdateOperationsInput | string | null
    hive?: HiveUpdateOneRequiredWithoutInspectionsNestedInput
    actions?: ActionUpdateManyWithoutInspectionNestedInput
  }

  export type InspectionUncheckedUpdateWithoutObservationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    hiveId?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    weatherConditions?: NullableStringFieldUpdateOperationsInput | string | null
    actions?: ActionUncheckedUpdateManyWithoutInspectionNestedInput
  }

  export type InspectionCreateWithoutActionsInput = {
    id?: string
    date: Date | string
    weatherConditions?: string | null
    hive: HiveCreateNestedOneWithoutInspectionsInput
    observations?: ObservationCreateNestedManyWithoutInspectionInput
  }

  export type InspectionUncheckedCreateWithoutActionsInput = {
    id?: string
    hiveId: string
    date: Date | string
    weatherConditions?: string | null
    observations?: ObservationUncheckedCreateNestedManyWithoutInspectionInput
  }

  export type InspectionCreateOrConnectWithoutActionsInput = {
    where: InspectionWhereUniqueInput
    create: XOR<InspectionCreateWithoutActionsInput, InspectionUncheckedCreateWithoutActionsInput>
  }

  export type InspectionUpsertWithoutActionsInput = {
    update: XOR<InspectionUpdateWithoutActionsInput, InspectionUncheckedUpdateWithoutActionsInput>
    create: XOR<InspectionCreateWithoutActionsInput, InspectionUncheckedCreateWithoutActionsInput>
    where?: InspectionWhereInput
  }

  export type InspectionUpdateToOneWithWhereWithoutActionsInput = {
    where?: InspectionWhereInput
    data: XOR<InspectionUpdateWithoutActionsInput, InspectionUncheckedUpdateWithoutActionsInput>
  }

  export type InspectionUpdateWithoutActionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    weatherConditions?: NullableStringFieldUpdateOperationsInput | string | null
    hive?: HiveUpdateOneRequiredWithoutInspectionsNestedInput
    observations?: ObservationUpdateManyWithoutInspectionNestedInput
  }

  export type InspectionUncheckedUpdateWithoutActionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    hiveId?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    weatherConditions?: NullableStringFieldUpdateOperationsInput | string | null
    observations?: ObservationUncheckedUpdateManyWithoutInspectionNestedInput
  }

  export type HiveCreateManyApiaryInput = {
    id?: string
    name: string
    status?: $Enums.HiveStatus
    installationDate?: Date | string | null
  }

  export type HiveUpdateWithoutApiaryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumHiveStatusFieldUpdateOperationsInput | $Enums.HiveStatus
    installationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    queens?: QueenUpdateManyWithoutHiveNestedInput
    boxes?: BoxUpdateManyWithoutHiveNestedInput
    inspections?: InspectionUpdateManyWithoutHiveNestedInput
  }

  export type HiveUncheckedUpdateWithoutApiaryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumHiveStatusFieldUpdateOperationsInput | $Enums.HiveStatus
    installationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    queens?: QueenUncheckedUpdateManyWithoutHiveNestedInput
    boxes?: BoxUncheckedUpdateManyWithoutHiveNestedInput
    inspections?: InspectionUncheckedUpdateManyWithoutHiveNestedInput
  }

  export type HiveUncheckedUpdateManyWithoutApiaryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    status?: EnumHiveStatusFieldUpdateOperationsInput | $Enums.HiveStatus
    installationDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type QueenCreateManyHiveInput = {
    id?: string
    markingColor?: string | null
    year?: number | null
    source?: string | null
    status: $Enums.QueenStatus
    installedAt: Date | string
    replacedAt?: Date | string | null
  }

  export type BoxCreateManyHiveInput = {
    id?: string
    position: number
    frameCount: number
    hasExcluder?: boolean
    type: $Enums.BoxType
  }

  export type InspectionCreateManyHiveInput = {
    id?: string
    date: Date | string
    weatherConditions?: string | null
  }

  export type QueenUpdateWithoutHiveInput = {
    id?: StringFieldUpdateOperationsInput | string
    markingColor?: NullableStringFieldUpdateOperationsInput | string | null
    year?: NullableIntFieldUpdateOperationsInput | number | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQueenStatusFieldUpdateOperationsInput | $Enums.QueenStatus
    installedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replacedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type QueenUncheckedUpdateWithoutHiveInput = {
    id?: StringFieldUpdateOperationsInput | string
    markingColor?: NullableStringFieldUpdateOperationsInput | string | null
    year?: NullableIntFieldUpdateOperationsInput | number | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQueenStatusFieldUpdateOperationsInput | $Enums.QueenStatus
    installedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replacedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type QueenUncheckedUpdateManyWithoutHiveInput = {
    id?: StringFieldUpdateOperationsInput | string
    markingColor?: NullableStringFieldUpdateOperationsInput | string | null
    year?: NullableIntFieldUpdateOperationsInput | number | null
    source?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumQueenStatusFieldUpdateOperationsInput | $Enums.QueenStatus
    installedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replacedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type BoxUpdateWithoutHiveInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    frameCount?: IntFieldUpdateOperationsInput | number
    hasExcluder?: BoolFieldUpdateOperationsInput | boolean
    type?: EnumBoxTypeFieldUpdateOperationsInput | $Enums.BoxType
  }

  export type BoxUncheckedUpdateWithoutHiveInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    frameCount?: IntFieldUpdateOperationsInput | number
    hasExcluder?: BoolFieldUpdateOperationsInput | boolean
    type?: EnumBoxTypeFieldUpdateOperationsInput | $Enums.BoxType
  }

  export type BoxUncheckedUpdateManyWithoutHiveInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    frameCount?: IntFieldUpdateOperationsInput | number
    hasExcluder?: BoolFieldUpdateOperationsInput | boolean
    type?: EnumBoxTypeFieldUpdateOperationsInput | $Enums.BoxType
  }

  export type InspectionUpdateWithoutHiveInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    weatherConditions?: NullableStringFieldUpdateOperationsInput | string | null
    observations?: ObservationUpdateManyWithoutInspectionNestedInput
    actions?: ActionUpdateManyWithoutInspectionNestedInput
  }

  export type InspectionUncheckedUpdateWithoutHiveInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    weatherConditions?: NullableStringFieldUpdateOperationsInput | string | null
    observations?: ObservationUncheckedUpdateManyWithoutInspectionNestedInput
    actions?: ActionUncheckedUpdateManyWithoutInspectionNestedInput
  }

  export type InspectionUncheckedUpdateManyWithoutHiveInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    weatherConditions?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ObservationCreateManyInspectionInput = {
    id?: string
    type: string
    numericValue?: number | null
    textValue?: string | null
    notes?: string | null
  }

  export type ActionCreateManyInspectionInput = {
    id?: string
    type: string
    notes?: string | null
  }

  export type ObservationUpdateWithoutInspectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    numericValue?: NullableFloatFieldUpdateOperationsInput | number | null
    textValue?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ObservationUncheckedUpdateWithoutInspectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    numericValue?: NullableFloatFieldUpdateOperationsInput | number | null
    textValue?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ObservationUncheckedUpdateManyWithoutInspectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    numericValue?: NullableFloatFieldUpdateOperationsInput | number | null
    textValue?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ActionUpdateWithoutInspectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ActionUncheckedUpdateWithoutInspectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ActionUncheckedUpdateManyWithoutInspectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}