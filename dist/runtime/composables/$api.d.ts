import type { NitroFetchOptions } from 'nitropack';
import type { FetchResponseData, FilterMethods, MethodOption, ParamsOption, RequestBodyOption } from '../openapi.js';
export interface SharedFetchOptions {
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
     * @default false
     */
    cache?: boolean;
    /**
     * By default, a cache key will be generated from the request options.
     * With this option, you can provide a custom cache key.
     * @default undefined
     */
    key?: string;
}
export type ApiClientFetchOptions = Omit<NitroFetchOptions<string>, 'body' | 'cache'> & {
    path?: Record<string, string>;
    body?: string | Record<string, any> | FormData | null;
};
export type OpenAPIClientFetchOptions<Method, LowercasedMethod, Params, Operation = 'get' extends LowercasedMethod ? ('get' extends keyof Params ? Params['get'] : never) : LowercasedMethod extends keyof Params ? Params[LowercasedMethod] : never> = MethodOption<Method, Params> & ParamsOption<Operation> & RequestBodyOption<Operation> & Omit<NitroFetchOptions<string>, 'query' | 'body' | 'method' | 'cache'> & SharedFetchOptions;
export type ApiClient = <T = unknown>(path: string, opts?: ApiClientFetchOptions & SharedFetchOptions) => Promise<T>;
export type OpenAPIClient<Paths> = <ReqT extends Extract<keyof Paths, string>, Methods extends FilterMethods<Paths[ReqT]>, Method extends Extract<keyof Methods, string> | Uppercase<Extract<keyof Methods, string>>, LowercasedMethod extends Lowercase<Method> extends keyof Methods ? Lowercase<Method> : never, DefaultMethod extends 'get' extends LowercasedMethod ? 'get' : LowercasedMethod, ResT = Methods[DefaultMethod] extends Record<PropertyKey, any> ? FetchResponseData<Methods[DefaultMethod]> : never>(path: ReqT, options?: OpenAPIClientFetchOptions<Method, LowercasedMethod, Methods>) => Promise<ResT>;
export declare function _$api<T = unknown>(endpointId: string, path: string, opts?: ApiClientFetchOptions & SharedFetchOptions): Promise<any>;
