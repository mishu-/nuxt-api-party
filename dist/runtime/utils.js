import { formDataToObject, isFormData, isSerializedFormData, objectToFormData } from "./form-data.js";
export function headersToObject(headers = {}) {
  return Object.fromEntries(new Headers(headers));
}
export async function serializeMaybeEncodedBody(value) {
  if (isFormData(value))
    return await formDataToObject(value);
  return value;
}
export async function deserializeMaybeEncodedBody(value) {
  if (isSerializedFormData(value))
    return await objectToFormData(value);
  return value;
}
