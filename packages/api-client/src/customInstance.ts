import Axios, { AxiosRequestConfig, AxiosResponse} from 'axios';

export const AXIOS_INSTANCE = Axios.create(); // use your own URL here or environment variable

// add a second `options` argument here if you want to pass extra options to each generated query

export const customInstance = <T>(
  config: AxiosRequestConfig,

  options?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => {
  const source = Axios.CancelToken.source();

  const promise = AXIOS_INSTANCE({
    ...config,

    ...options,

    cancelToken: source.token,
  })

  // @ts-ignore

  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};
