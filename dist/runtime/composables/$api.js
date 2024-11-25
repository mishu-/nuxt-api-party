import { useNuxtApp, useRequestHeaders, useRuntimeConfig } from "#imports";
import { hash } from "ohash";
import { joinURL } from "ufo";
import { CACHE_KEY_PREFIX } from "../constants.js";
import { isFormData } from "../form-data.js";
import { resolvePathParams } from "../openapi.js";
import { headersToObject, serializeMaybeEncodedBody } from "../utils.js";
export function _$api(endpointId, path, opts = {}) {
  const nuxt = useNuxtApp();
  const apiParty = useRuntimeConfig().public.apiParty;
  const promiseMap = nuxt._pendingRequests ||= /* @__PURE__ */ new Map();
  const {
    path: pathParams,
    query,
    headers,
    method,
    body,
    client = apiParty.client === "always",
    cache = false,
    key,
    ...fetchOptions
  } = opts;
  const _key = key === void 0 ? CACHE_KEY_PREFIX + hash([
    endpointId,
    path,
    pathParams,
    query,
    method,
    ...isFormData(body) ? [] : [body]
  ]) : CACHE_KEY_PREFIX + key;
  if (client && !apiParty.client)
    throw new Error('Client-side API requests are disabled. Set "client: true" in the module options to enable them.');
  if ((nuxt.isHydrating || cache) && nuxt.payload.data[_key])
    return Promise.resolve(nuxt.payload.data[_key]);
  if (promiseMap.has(_key))
    return promiseMap.get(_key);
  const endpoint = (apiParty.endpoints || {})[endpointId];
  const clientFetcher = () => globalThis.$fetch(resolvePathParams(path, pathParams), {
    ...fetchOptions,
    baseURL: endpoint.url,
    method,
    query: {
      ...endpoint.query,
      ...query
    },
    headers: {
      ...endpoint.token && { Authorization: `Bearer ${endpoint.token}` },
      ...endpoint.headers,
      ...headersToObject(headers)
    },
    body
  });
  const serverFetcher = async () => await globalThis.$fetch(joinURL("/api", apiParty.server.basePath, endpointId), {
    ...fetchOptions,
    method: "POST",
    body: {
      path: resolvePathParams(path, pathParams),
      query,
      headers: {
        ...headersToObject(headers),
        ...endpoint.cookies && useRequestHeaders(["cookie"])
      },
      method,
      body: await serializeMaybeEncodedBody(body)
    }
  });
  const request = (client ? clientFetcher() : serverFetcher()).then((response) => {
    if (import.meta.server || cache)
      nuxt.payload.data[_key] = response;
    promiseMap.delete(_key);
    return response;
  }).catch((error) => {
    nuxt.payload.data[_key] = void 0;
    promiseMap.delete(_key);
    throw error;
  });
  promiseMap.set(_key, request);
  return request;
}
