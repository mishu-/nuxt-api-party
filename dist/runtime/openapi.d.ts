import type { NuxtError } from 'nuxt/app';
import type { ErrorResponse, IsOperationRequestBodyOptional, MediaType, OperationRequestBodyContent, ResponseObjectMap, SuccessResponse } from 'openapi-typescript-helpers';
import type { MaybeRefOrGetter } from 'vue';
export type FetchResponseData<T extends Record<PropertyKey, any>> = SuccessResponse<ResponseObjectMap<T>, MediaType>;
export type FetchResponseError<T extends Record<PropertyKey, any>> = NuxtError<ErrorResponse<ResponseObjectMap<T>, MediaType>>;
export type MethodOption<M, P> = 'get' extends keyof P ? {
    method?: M;
} : {
    method: M;
};
export type ParamsOption<T> = T extends {
    parameters?: any;
    query?: any;
} ? T['parameters'] : Record<string, unknown>;
export type RequestBodyOption<T> = OperationRequestBodyContent<T> extends never ? {
    body?: never;
} : IsOperationRequestBodyOptional<T> extends true ? {
    body?: OperationRequestBodyContent<T>;
} : {
    body: OperationRequestBodyContent<T>;
};
export type FilterMethods<T> = {
    [K in keyof Omit<T, 'parameters'> as T[K] extends never | undefined ? never : K]: T[K];
};
export declare function resolvePathParams(path: string, params?: Record<string, MaybeRefOrGetter<unknown>>): string;
