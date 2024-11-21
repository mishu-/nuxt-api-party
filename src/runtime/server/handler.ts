import type { ModuleOptions } from '../../module'
import type { H3Event } from 'h3'
import type { EndpointFetchOptions } from '../types'
import { useRuntimeConfig } from '#imports'
import { createHooks } from 'hookable'

import {
  createError,
  defineEventHandler,
  getRequestHeader,
  getRouterParam,
  readBody,
  send,
  setResponseHeader,
  setResponseStatus,
  splitCookiesString,
} from 'h3'
import { deserializeMaybeEncodedBody } from '../utils'

export interface ServerHooks {
  headersPreRequest: (headers: HeadersInit, event: H3Event) => void | Promise<void>

}

export const serverHooks = createHooks<ServerHooks>()


export default defineEventHandler(async (event) => {
  const endpointId = getRouterParam(event, 'endpointId')!
  const apiParty = useRuntimeConfig().apiParty as Required<ModuleOptions>
  const endpoints = apiParty.endpoints || {}
  const endpoint = endpoints[endpointId]

  if (!endpoint) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown API endpoint "${endpointId}"`,
    })
  }

  const _body = await readBody<EndpointFetchOptions>(event)

  const {
    path,
    query,
    headers,
    method,
    body,
  } = _body

  // Check if the path is an absolute URL
  if (new URL(path, 'http://localhost').origin !== 'http://localhost') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Absolute URLs are not allowed',
    })
  }

  // Allows to overwrite the backend URL with a custom header
  // (e.g. `jsonPlaceholder` endpoint becomes `jsonPlaceholder-Endpoint-Url`)
  const baseURL = new Headers(headers).get(`${endpointId}-Endpoint-Url`) || endpoint.url

  // Check if the base URL is in the allow list
  if (
    baseURL !== endpoint.url
    && !endpoint.allowedUrls?.includes(baseURL)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: `Base URL "${baseURL}" is not allowed`,
    })
  }

  // Add any server runtime headers you might want
  await sessionHooks.callHookParallel('clear',  event)
  

  try {
    const response = await globalThis.$fetch.raw<ArrayBuffer>(
      path,
      {
        method,
        baseURL,
        query: {
          ...endpoint.query,
          ...query,
        },
        headers: {
          ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
          ...(endpoint.cookies && { cookie: getRequestHeader(event, 'cookie') }),
          ...endpoint.headers,
          ...headers,
        },
        ...(body && { body: await deserializeMaybeEncodedBody(body) }),
        responseType: 'arrayBuffer',
        ignoreResponseError: true,
      },
    )

    setResponseStatus(event, response.status, response.statusText)

    const cookies: string[] = []

    for (const [key, value] of response.headers.entries()) {
      if (key === 'content-encoding')
        continue

      if (key === 'content-length')
        continue

      if (key === 'set-cookie') {
        cookies.push(...splitCookiesString(value))
        continue
      }

      setResponseHeader(event, key, value)
    }

    if (cookies.length > 0)
      setResponseHeader(event, 'set-cookie', cookies)

    return send(event, new Uint8Array(response._data ?? []))
  }
  catch (error) {
    console.error(error)

    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
    })
  }
})
