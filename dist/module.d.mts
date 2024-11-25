import * as _nuxt_schema from '@nuxt/schema';
import { HookResult } from '@nuxt/schema';
import { OpenAPI3, OpenAPITSOptions } from 'openapi-typescript';
import { QueryObject } from 'ufo';

interface EndpointConfiguration {
    url: string;
    token?: string;
    query?: QueryObject;
    headers?: Record<string, string>;
    cookies?: boolean;
    allowedUrls?: string[];
    schema?: string | OpenAPI3;
    openAPITS?: OpenAPITSOptions;
}
interface ModuleOptions {
    /**
     * API endpoints
     *
     * @remarks
     * Each key represents an endpoint ID, which is used to generate the composables. The value is an object with the following properties:
     * - `url`: The URL of the API endpoint
     * - `token`: The API token to use for the endpoint (optional)
     * - `query`: Query parameters to send with each request (optional)
     * - `headers`: Headers to send with each request (optional)
     * - `cookies`: Whether to send cookies with each request (optional)
     * - `allowedUrls`: A list of allowed URLs to change the [backend URL at runtime](https://nuxt-api-party.byjohann.dev/guide/dynamic-backend-url) (optional)
     * - `schema`: A URL, file path, object, or async function pointing to an [OpenAPI Schema](https://swagger.io/resources/open-api) used to [generate types](/guide/openapi-types) (optional)
     * - `openAPITS`: [Configuration options](https://openapi-ts.pages.dev/node/#options) for `openapi-typescript`. Options defined here will override the global `openAPITS`
     *
     * @example
     * export default defineNuxtConfig({
     *   apiParty: {
     *     endpoints: {
     *       jsonPlaceholder: {
     *         url: 'https://jsonplaceholder.typicode.com'
     *         headers: {
     *           Authorization: `Basic ${globalThis.btoa('username:password')}`
     *         }
     *       }
     *     }
     *   }
     * })
     *
     * @default {}
     */
    endpoints?: Record<string, EndpointConfiguration>;
    /**
     * Allow client-side requests besides server-side ones
     *
     * @remarks
     * By default, API requests are only made on the server-side. This option allows you to make requests on the client-side as well. Keep in mind that this will expose your API credentials to the client.
     * Note: If Nuxt SSR is disabled, all requests are made on the client-side by default.
     *
     * @example
     * useJsonPlaceholderData('/posts/1', { client: true })
     *
     * @default false
     */
    client?: boolean | 'allow' | 'always';
    /**
     * Global options for openapi-typescript
     */
    openAPITS?: OpenAPITSOptions;
    server?: {
        /**
         * The API base route for the Nuxt server handler
         *
         * @default '__api_party'
         */
        basePath?: string;
    };
}
declare module '@nuxt/schema' {
    interface RuntimeConfig {
        apiParty: ModuleOptions;
    }
    interface NuxtHooks {
        'api-party:extend': (options: ModuleOptions) => HookResult;
    }
}
declare const _default: _nuxt_schema.NuxtModule<ModuleOptions, ModuleOptions, false>;

export { type EndpointConfiguration, type ModuleOptions, _default as default };
