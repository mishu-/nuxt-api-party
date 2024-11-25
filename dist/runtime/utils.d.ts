import type { ApiClientFetchOptions } from './composables/$api.js';
export declare function headersToObject(headers?: HeadersInit): Record<string, string>;
export declare function serializeMaybeEncodedBody(value: ApiClientFetchOptions['body']): Promise<string | Record<string, any> | null | undefined>;
export declare function deserializeMaybeEncodedBody(value: ApiClientFetchOptions['body']): Promise<string | FormData | Record<string, any> | null | undefined>;
