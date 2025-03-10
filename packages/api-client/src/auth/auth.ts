/**
 * Generated by orval v7.5.0 🍺
 * Do not edit manually.
 * API Example
 * The API description
 * OpenAPI spec version: 1.0
 */
import { useMutation } from '@tanstack/react-query';
import type {
  MutationFunction,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

export const authControllerLogin = (
  options?: AxiosRequestConfig,
): Promise<AxiosResponse<void>> => {
  return axios.post(`/api/auth/login`, undefined, options);
};

export const getAuthControllerLoginMutationOptions = <
  TError = AxiosError<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof authControllerLogin>>,
    TError,
    void,
    TContext
  >;
  axios?: AxiosRequestConfig;
}): UseMutationOptions<
  Awaited<ReturnType<typeof authControllerLogin>>,
  TError,
  void,
  TContext
> => {
  const mutationKey = ['authControllerLogin'];
  const { mutation: mutationOptions, axios: axiosOptions } = options
    ? options.mutation &&
      'mutationKey' in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, axios: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof authControllerLogin>>,
    void
  > = () => {
    return authControllerLogin(axiosOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type AuthControllerLoginMutationResult = NonNullable<
  Awaited<ReturnType<typeof authControllerLogin>>
>;

export type AuthControllerLoginMutationError = AxiosError<unknown>;

export const useAuthControllerLogin = <
  TError = AxiosError<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof authControllerLogin>>,
    TError,
    void,
    TContext
  >;
  axios?: AxiosRequestConfig;
}): UseMutationResult<
  Awaited<ReturnType<typeof authControllerLogin>>,
  TError,
  void,
  TContext
> => {
  const mutationOptions = getAuthControllerLoginMutationOptions(options);

  return useMutation(mutationOptions);
};
