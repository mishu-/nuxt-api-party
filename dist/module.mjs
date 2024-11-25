import { useNuxt, defineNuxtModule, useLogger, createResolver, addServerHandler, addImportsSources, addTemplate } from '@nuxt/kit';
import { defu } from 'defu';
import { createJiti } from 'jiti';
import { resolve, relative } from 'pathe';
import { pascalCase, camelCase } from 'scule';
import { joinURL } from 'ufo';

const name = "nuxt-api-party";

async function generateDeclarationTypes(endpoints, globalOpenAPIOptions) {
  const resolvedSchemaEntries = await Promise.all(
    Object.entries(endpoints).filter((entry) => Boolean(entry[1].schema)).map(async ([id, endpoint]) => {
      const types = await generateSchemaTypes({ id, endpoint, openAPITSOptions: globalOpenAPIOptions });
      return [id, types];
    })
  );
  return resolvedSchemaEntries.map(
    ([id, types]) => `
declare module "#nuxt-api-party/${id}" {
${normalizeIndentation(types).trimEnd()}

  // Request and response types
  export type Response<
    T extends keyof operations,
    R extends keyof operations[T]['responses'] = 200 extends keyof operations[T]['responses'] ? 200 : never
  > = operations[T]['responses'][R] extends { content: { 'application/json': infer U } } ? U : never
  export type RequestBody<
    T extends keyof operations
  > = operations[T]['requestBody'] extends { content: { 'application/json': infer U } } ? U : never
  export type RequestQuery<
    T extends keyof operations
  > = operations[T]['parameters'] extends { query?: infer U } ? U : never
}`.trimStart()
  ).join("\n\n").trimStart();
}
async function generateSchemaTypes(options) {
  const openAPITS = await interopDefault(import('openapi-typescript'));
  const { astToString } = await import('openapi-typescript');
  const schema = await resolveSchema(options.id, options.endpoint);
  try {
    const ast = await openAPITS(schema, {
      // @ts-expect-error: openapi-typescript >= 7 dropped this option
      commentHeader: "",
      ...options.openAPITSOptions,
      ...options.endpoint.openAPITS
    });
    if (typeof ast !== "string") {
      return astToString(ast);
    }
    return ast;
  } catch (error) {
    console.error(`Failed to generate types for ${options.id}`);
    console.error(error);
    return `
export type paths = Record<string, never>
export type webhooks = Record<string, never>
export interface components {
  schemas: never
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export type operations = Record<string, never>
`.trimStart();
  }
}
async function resolveSchema(id, { schema }) {
  const nuxt = useNuxt();
  if (typeof schema === "function") {
    console.warn(`[nuxt-api-party] Passing a function to "apiParty.endpoints.${id}.schema" is deprecated. Use the "api-party:extend" hook instead.`);
    return await schema();
  }
  if (typeof schema === "string" && !isValidUrl(schema))
    return new URL(resolve(nuxt.options.rootDir, schema), import.meta.url);
  return schema;
}
function isValidUrl(url) {
  try {
    return Boolean(new URL(url));
  } catch {
    return false;
  }
}
async function interopDefault(m) {
  const resolved = await m;
  return resolved.default || resolved;
}
function normalizeIndentation(code) {
  const replacedCode = code.replace(/^( {4})+/gm, (match) => "  ".repeat(match.length / 4));
  const normalizedCode = replacedCode.replace(/^/gm, "  ");
  return normalizedCode;
}

const module = defineNuxtModule({
  meta: {
    name,
    configKey: "apiParty",
    compatibility: {
      nuxt: ">=3.7"
    }
  },
  defaults: {
    endpoints: {},
    client: false,
    openAPITS: {},
    server: {
      basePath: "__api_party"
    }
  },
  async setup(options, nuxt) {
    const moduleName = name;
    const logger = useLogger(moduleName);
    const getRawComposableName = (endpointId) => `$${camelCase(endpointId)}`;
    const getDataComposableName = (endpointId) => `use${pascalCase(endpointId)}Data`;
    if (!Object.keys(options.endpoints).length && !nuxt.options.runtimeConfig.apiParty)
      logger.error("Missing API endpoints configuration. Please check the `apiParty` module configuration in `nuxt.config.ts`.");
    nuxt.options.runtimeConfig.apiParty = defu(
      nuxt.options.runtimeConfig.apiParty,
      options
    );
    if (!nuxt.options.ssr) {
      logger.info("Enabling Nuxt API Party client requests by default because SSR is disabled.");
      options.client = "always";
    }
    const resolvedOptions = nuxt.options.runtimeConfig.apiParty;
    nuxt.callHook("api-party:extend", resolvedOptions);
    nuxt.options.runtimeConfig.public.apiParty = defu(
      nuxt.options.runtimeConfig.public.apiParty,
      resolvedOptions.client ? resolvedOptions : {
        // Only expose cookies endpoint option to the client
        endpoints: Object.fromEntries(
          Object.entries(resolvedOptions.endpoints).map(
            ([endpointId, endpoint]) => [endpointId, { cookies: endpoint.cookies }]
          )
        ),
        client: false,
        server: resolvedOptions.server
      }
    );
    const { resolve } = createResolver(import.meta.url);
    nuxt.options.build.transpile.push(resolve("runtime"));
    const relativeTo = (path) => relative(
      resolve(nuxt.options.rootDir, nuxt.options.buildDir, "module"),
      resolve(path)
    );
    const endpointKeys = Object.keys(resolvedOptions.endpoints);
    const schemaEndpoints = Object.fromEntries(
      Object.entries(resolvedOptions.endpoints).filter(([, endpoint]) => "schema" in endpoint)
    );
    const schemaEndpointIds = Object.keys(schemaEndpoints);
    const jiti = createJiti(nuxt.options.rootDir, { alias: nuxt.options.alias });
    const openAPITSSrc = jiti.esmResolve("openapi-typescript", { default: true, try: true });
    if (schemaEndpointIds.length && !openAPITSSrc) {
      logger.warn("OpenAPI types generation is enabled, but the `openapi-typescript` package is not found. Please install it to enable endpoint types generation.");
      schemaEndpointIds.length = 0;
    }
    if (nuxt.options.nitro.imports !== false) {
      nuxt.options.nitro.imports = defu(nuxt.options.nitro.imports, {
        presets: [
          {
            from: resolve("./runtime/server/handler"),
            imports: [
              "serverHooks"
            ]
          }
        ]
      });
    }
    addServerHandler({
      route: joinURL("/api", options.server.basePath, ":endpointId"),
      handler: resolve("runtime/server/handler"),
      method: "post"
    });
    nuxt.hook("nitro:config", (config) => {
      config.externals ||= {};
      config.externals.inline ||= [];
      config.externals.inline.push(...[
        resolve("runtime/utils"),
        resolve("runtime/form-data"),
        resolve("runtime/server/$api")
      ]);
      config.alias ||= {};
      config.alias[`#${moduleName}/server`] = resolve(nuxt.options.buildDir, `module/${moduleName}-nitro`);
      config.virtual ||= {};
      config.virtual[`#${moduleName}/server`] = () => `
import { _$api } from '${resolve("runtime/server/$api")}'
${endpointKeys.map((i) => `
export const ${getRawComposableName(i)} = (...args) => _$api('${i}', ...args)
`.trimStart()).join("")}`.trimStart();
      if (schemaEndpointIds.length) {
        config.typescript ||= {};
        config.typescript.tsConfig ||= {};
        config.typescript.tsConfig.include ||= [];
        config.typescript.tsConfig.include.push(`./module/${moduleName}-schema.d.ts`);
      }
      config.imports = defu(config.imports, {
        presets: [{
          from: `#${moduleName}/server`,
          imports: endpointKeys.map(getRawComposableName)
        }]
      });
    });
    addImportsSources({
      from: resolve(nuxt.options.buildDir, `module/${moduleName}`),
      imports: endpointKeys.flatMap((i) => [getRawComposableName(i), getDataComposableName(i)])
    });
    nuxt.options.alias[`#${moduleName}`] = resolve(nuxt.options.buildDir, `module/${moduleName}`);
    addTemplate({
      filename: `module/${moduleName}.mjs`,
      getContents() {
        return `
import { _$api } from '${resolve("runtime/composables/$api")}'
import { _useApiData } from '${resolve("runtime/composables/useApiData")}'
${endpointKeys.map((i) => `
export const ${getRawComposableName(i)} = (...args) => _$api('${i}', ...args)
export const ${getDataComposableName(i)} = (...args) => _useApiData('${i}', ...args)
`.trimStart()).join("")}`.trimStart();
      }
    });
    addTemplate({
      filename: `module/${moduleName}.d.ts`,
      getContents() {
        return `
// Generated by ${moduleName}
import type { ApiClient, OpenAPIClient, ApiClientFetchOptions, OpenAPIClientFetchOptions } from '${relativeTo("runtime/composables/$api")}'
import type { UseApiData, UseOpenAPIData, UseApiDataOptions, UseOpenAPIDataOptions } from '${relativeTo("runtime/composables/useApiData")}'

${schemaEndpointIds.map((i) => `
import type { paths as ${pascalCase(i)}Paths, operations as ${pascalCase(i)}Operations } from '#${moduleName}/${i}'
`.trimStart()).join("").trimEnd()}

// OpenAPI helpers
export type { FetchResponseData, FetchResponseError, MethodOption, ParamsOption, RequestBodyOption, FilterMethods } from '${relativeTo("runtime/openapi")}'
// Clients
export type { ApiClient, OpenAPIClient, ApiClientFetchOptions, OpenAPIClientFetchOptions, UseApiData, UseOpenAPIData, UseApiDataOptions, UseOpenAPIDataOptions }

${endpointKeys.map((i) => `
export declare const ${getRawComposableName(i)}: ${schemaEndpointIds.includes(i) ? `OpenAPIClient<${pascalCase(i)}Paths>` : "ApiClient"}
export declare const ${getDataComposableName(i)}: ${schemaEndpointIds.includes(i) ? `UseOpenAPIData<${pascalCase(i)}Paths>` : "UseApiData"}
`.trimStart()).join("").trimEnd()}
`.trimStart();
      }
    });
    addTemplate({
      filename: `module/${moduleName}-nitro.d.ts`,
      getContents() {
        return `
// Generated by ${moduleName}
export { ${endpointKeys.map(getRawComposableName).join(", ")} } from './${moduleName}'
`.trimStart();
      }
    });
    if (schemaEndpointIds.length) {
      addTemplate({
        filename: `module/${moduleName}-schema.d.ts`,
        async getContents() {
          return `
// Generated by ${moduleName}
${await generateDeclarationTypes(schemaEndpoints, resolvedOptions.openAPITS)}
`.trimStart();
        }
      });
      nuxt.hook("prepare:types", ({ references }) => {
        references.push({ path: resolve(nuxt.options.buildDir, `module/${moduleName}-schema.d.ts`) });
      });
    }
  }
});

export { module as default };
