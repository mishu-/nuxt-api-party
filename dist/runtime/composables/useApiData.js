import { useAsyncData, useRequestHeaders, useRuntimeConfig } from "#imports";
import { hash } from "ohash";
import { joinURL } from "ufo";
import { computed, reactive, toValue } from "vue";
import { CACHE_KEY_PREFIX } from "../constants.js";
import { isFormData } from "../form-data.js";
import { resolvePathParams } from "../openapi.js";
import { headersToObject, serializeMaybeEncodedBody } from "../utils.js";
export function _useApiData(endpointId, path, opts = {}) {
  const apiParty = useRuntimeConfig().public.apiParty;
  const {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick,
    watch,
    immediate,
    path: pathParams,
    query,
    headers,
    method,
    body,
    client = apiParty.client === "always",
    cache = true,
    key,
    ...fetchOptions
  } = opts;
  const _path = computed(() => resolvePathParams(toValue(path), toValue(pathParams)));
  const _key = computed(
    key === void 0 ? () => CACHE_KEY_PREFIX + hash([
      endpointId,
      _path.value,
      toValue(query),
      toValue(method),
      ...isFormData(toValue(body)) ? [] : [toValue(body)]
    ]) : () => CACHE_KEY_PREFIX + toValue(key)
  );
  if (client && !apiParty.client)
    throw new Error('Client-side API requests are disabled. Set "client: true" in the module options to enable them.');
  const endpoint = (apiParty.endpoints || {})[endpointId];
  const _fetchOptions = reactive(fetchOptions);
  const _endpointFetchOptions = reactive({
    path: _path,
    query,
    headers: computed(() => ({
      ...headersToObject(toValue(headers)),
      ...endpoint.cookies && useRequestHeaders(["cookie"])
    })),
    method,
    body
  });
  const _asyncDataOptions = {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick,
    watch: watch === false ? [] : [
      _endpointFetchOptions,
      ...watch || []
    ],
    immediate
  };
  let controller;
  return useAsyncData(
    _key.value,
    async (nuxt) => {
      controller?.abort?.();
      if (nuxt && (nuxt.isHydrating || cache) && nuxt.payload.data[_key.value])
        return nuxt.payload.data[_key.value];
      controller = new AbortController();
      let result;
      try {
        if (client) {
          result = await globalThis.$fetch(_path.value, {
            ..._fetchOptions,
            signal: controller.signal,
            baseURL: endpoint.url,
            method: _endpointFetchOptions.method,
            query: {
              ...endpoint.query,
              ..._endpointFetchOptions.query
            },
            headers: {
              ...endpoint.token && { Authorization: `Bearer ${endpoint.token}` },
              ...endpoint.headers,
              ..._endpointFetchOptions.headers
            },
            body: _endpointFetchOptions.body
          });
        } else {
          result = await globalThis.$fetch(
            joinURL("/api", apiParty.server.basePath, endpointId),
            {
              ..._fetchOptions,
              signal: controller.signal,
              method: "POST",
              body: {
                ..._endpointFetchOptions,
                body: await serializeMaybeEncodedBody(_endpointFetchOptions.body)
              }
            }
          );
        }
      } catch (error) {
        if (nuxt) nuxt.payload.data[_key.value] = void 0;
        throw error;
      }
      if (nuxt && cache)
        nuxt.payload.data[_key.value] = result;
      return result;
    },
    _asyncDataOptions
  );
}
