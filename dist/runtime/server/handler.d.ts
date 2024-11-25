import type { H3Event } from 'h3';
export interface ServerHooks {
    headersPreRequest: (headers: HeadersInit, event: H3Event) => void | Promise<void>;
}
export declare const serverHooks: import("hookable").Hookable<ServerHooks, "headersPreRequest">;
declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, Promise<void>>;
export default _default;
