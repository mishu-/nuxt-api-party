import type { NitroFetchOptions } from 'nitropack';
import type { AsyncData, AsyncDataOptions, NuxtError } from 'nuxt/app';
import type { MaybeRef, MaybeRefOrGetter, MultiWatchSources } from 'vue';
import type { FetchResponseData, FetchResponseError, FilterMethods, ParamsOption, RequestBodyOption } from '../openapi.js';
type ComputedOptions<T> = {
    [K in keyof T]: T[K] extends Function ? T[K] : T[K] extends Record<string, any> ? ComputedOptions<T[K]> | MaybeRef<T[K]> : MaybeRef<T[K]>;
};
type ComputedMethodOption<M, P> = 'get' extends keyof P ? ComputedOptions<{
    method?: M;
}> : ComputedOptions<{
    method: M;
}>;
export type SharedAsyncDataOptions<ResT, DataT = ResT> = Omit<AsyncDataOptions<ResT, DataT>, 'watch'> & {
    /**
     * Skip the Nuxt server proxy and fetch directly from the API.
     * Requires `client` set to `true` in the module options.
     * @remarks
     * If Nuxt SSR is disabled, client-side requests are enabled by default.
     * @default false
     */
    client?: boolean;
    /**
     * Cache the response for the same request.
     * You can customize the cache key with the `key` option.
     * @default true
     */
    cache?: boolean;
    /**
     * By default, a cache key will be generated from the request options.
     * With this option, you can provide a custom cache key.
     * @default undefined
     */
    key?: MaybeRefOrGetter<string>;
    /**
     * Watch an array of reactive sources and auto-refresh the fetch result when they change.
     * Fetch options and URL are watched by default. You can completely ignore reactive sources by using `watch: false`.
     * @default undefined
     */
    watch?: MultiWatchSources | false;
};
export type UseApiDataOptions<T> = Pick<ComputedOptions<NitroFetchOptions<string>>, 'onRequest' | 'onRequestError' | 'onResponse' | 'onResponseError' | 'query' | 'headers' | 'method' | 'retry' | 'retryDelay' | 'retryStatusCodes' | 'timeout'> & {
    path?: MaybeRefOrGetter<Record<string, string>>;
    body?: MaybeRef<string | Record<string, any> | FormData | null>;
} & SharedAsyncDataOptions<T>;
export type UseApiData = <T = unknown>(path: MaybeRefOrGetter<string>, opts?: UseApiDataOptions<T>) => AsyncData<T | null, NuxtError>;
export type UseOpenAPIDataOptions<Method, LowercasedMethod, Params, ResT, DataT = ResT, Operation = 'get' extends LowercasedMethod ? ('get' extends keyof Params ? Params['get'] : never) : LowercasedMethod extends keyof Params ? Params[LowercasedMethod] : never> = ComputedMethodOption<Method, Params> & ComputedOptions<ParamsOption<Operation>> & ComputedOptions<RequestBodyOption<Operation>> & Omit<AsyncDataOptions<ResT, DataT>, 'query' | 'body' | 'method'> & Pick<NitroFetchOptions<string>, 'onRequest' | 'onRequestError' | 'onResponse' | 'onResponseError'> & SharedAsyncDataOptions<ResT, DataT>;
export type UseOpenAPIData<Paths> = <ReqT extends Extract<keyof Paths, string>, Methods extends FilterMethods<Paths[ReqT]>, Method extends Extract<keyof Methods, string> | Uppercase<Extract<keyof Methods, string>>, LowercasedMethod extends Lowercase<Method> extends keyof Methods ? Lowercase<Method> : never, DefaultMethod extends 'get' extends LowercasedMethod ? 'get' : LowercasedMethod, ResT = Methods[DefaultMethod] extends Record<PropertyKey, any> ? FetchResponseData<Methods[DefaultMethod]> : never, ErrorT = Methods[DefaultMethod] extends Record<PropertyKey, any> ? FetchResponseError<Methods[DefaultMethod]> : never, DataT = ResT>(path: MaybeRefOrGetter<ReqT>, options?: UseOpenAPIDataOptions<Method, LowercasedMethod, Methods, ResT, DataT>, autoKey?: string) => AsyncData<DataT | null, ErrorT>;
export declare function _useApiData<T = unknown>(endpointId: string, path: MaybeRefOrGetter<string>, opts?: UseApiDataOptions<T>): AsyncData<T | null, NuxtError>;
export {};
