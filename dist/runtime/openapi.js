import { toValue } from "vue";
export function resolvePathParams(path, params) {
  if (params) {
    for (const [key, value] of Object.entries(params))
      path = path.replace(`{${key}}`, encodeURIComponent(String(toValue(value))));
  }
  return path;
}
