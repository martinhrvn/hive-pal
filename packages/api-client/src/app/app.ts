/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */
import {
  useQuery
} from '@tanstack/react-query'
import type {
  DataTag,
  DefinedInitialDataOptions,
  DefinedUseQueryResult,
  QueryFunction,
  QueryKey,
  UndefinedInitialDataOptions,
  UseQueryOptions,
  UseQueryResult
} from '@tanstack/react-query'
import axios from 'axios'
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse
} from 'axios'



export const appControllerGetHello = (
     options?: AxiosRequestConfig
 ): Promise<AxiosResponse<string>> => {
    
    
    return axios.get(
      `/api`,options
    );
  }


export const getAppControllerGetHelloQueryKey = () => {
    return [`/api`] as const;
    }

    
export const getAppControllerGetHelloQueryOptions = <TData = Awaited<ReturnType<typeof appControllerGetHello>>, TError = AxiosError<unknown>>( options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof appControllerGetHello>>, TError, TData>>, axios?: AxiosRequestConfig}
) => {

const {query: queryOptions, axios: axiosOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getAppControllerGetHelloQueryKey();

  

    const queryFn: QueryFunction<Awaited<ReturnType<typeof appControllerGetHello>>> = ({ signal }) => appControllerGetHello({ signal, ...axiosOptions });

      

      

   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof appControllerGetHello>>, TError, TData> & { queryKey: DataTag<QueryKey, TData> }
}

export type AppControllerGetHelloQueryResult = NonNullable<Awaited<ReturnType<typeof appControllerGetHello>>>
export type AppControllerGetHelloQueryError = AxiosError<unknown>


export function useAppControllerGetHello<TData = Awaited<ReturnType<typeof appControllerGetHello>>, TError = AxiosError<unknown>>(
  options: { query:Partial<UseQueryOptions<Awaited<ReturnType<typeof appControllerGetHello>>, TError, TData>> & Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof appControllerGetHello>>,
          TError,
          Awaited<ReturnType<typeof appControllerGetHello>>
        > , 'initialData'
      >, axios?: AxiosRequestConfig}

  ):  DefinedUseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData> }
export function useAppControllerGetHello<TData = Awaited<ReturnType<typeof appControllerGetHello>>, TError = AxiosError<unknown>>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof appControllerGetHello>>, TError, TData>> & Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof appControllerGetHello>>,
          TError,
          Awaited<ReturnType<typeof appControllerGetHello>>
        > , 'initialData'
      >, axios?: AxiosRequestConfig}

  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData> }
export function useAppControllerGetHello<TData = Awaited<ReturnType<typeof appControllerGetHello>>, TError = AxiosError<unknown>>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof appControllerGetHello>>, TError, TData>>, axios?: AxiosRequestConfig}

  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData> }

export function useAppControllerGetHello<TData = Awaited<ReturnType<typeof appControllerGetHello>>, TError = AxiosError<unknown>>(
  options?: { query?:Partial<UseQueryOptions<Awaited<ReturnType<typeof appControllerGetHello>>, TError, TData>>, axios?: AxiosRequestConfig}

  ):  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData> } {

  const queryOptions = getAppControllerGetHelloQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData> };

  query.queryKey = queryOptions.queryKey ;

  return query;
}



