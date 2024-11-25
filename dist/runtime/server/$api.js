import { useRuntimeConfig } from "#imports";
import { resolvePathParams } from "../openapi.js";
import { headersToObject } from "../utils.js";
export function _$api(endpointId, path, opts = {}) {
  const { path: pathParams, query, headers, ...fetchOptions } = opts;
  const apiParty = useRuntimeConfig().apiParty;
  const endpoints = apiParty.endpoints || {};
  const endpoint = endpoints[endpointId];
  return globalThis.$fetch(resolvePathParams(path, pathParams), {
    ...fetchOptions,
    baseURL: endpoint.url,
    query: {
      ...endpoint.query,
      ...query
    },
    headers: {
      ...endpoint.token && { Authorization: `Bearer ${endpoint.token}` },
      ...endpoint.headers,
      ...headersToObject(headers)
    }
  });
}
