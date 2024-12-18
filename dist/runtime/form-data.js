export function isFormData(obj) {
  return obj instanceof FormData;
}
export function isSerializedFormData(obj) {
  return typeof obj === "object" && obj !== null && "__type" in obj && obj.__type === "form-data";
}
export async function formDataToObject(formData) {
  const obj = {
    __type: "form-data"
  };
  for (const [key, value] of formData.entries()) {
    if (value instanceof Blob) {
      const serializedBlob = {
        ...await serializeBlob(value),
        name: value.name,
        __type: "blob"
      };
      if (Array.isArray(obj[key]))
        obj[key].push(serializedBlob);
      else if (obj[key])
        obj[key] = [obj[key], serializedBlob];
      else
        obj[key] = serializedBlob;
    } else {
      if (Array.isArray(obj[key]))
        obj[key].push(value);
      else if (obj[key])
        obj[key] = [obj[key], value];
      else
        obj[key] = value;
    }
  }
  return obj;
}
export async function objectToFormData(obj) {
  const formData = new FormData();
  const entries = Object.entries(obj).filter(([key]) => key !== "__type");
  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isSerializedBlob(item)) {
          const blob = await deserializeBlob(item);
          formData.append(key, blob, item.name);
        } else {
          formData.append(key, item);
        }
      }
    } else if (isSerializedBlob(value)) {
      const blob = await deserializeBlob(value);
      formData.append(key, blob, value.name);
    } else {
      formData.append(key, value);
    }
  }
  return formData;
}
function isSerializedBlob(obj) {
  return typeof obj === "object" && obj !== null && "__type" in obj && obj.__type === "blob";
}
async function serializeBlob(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const byteArray = new Uint8Array(arrayBuffer);
  const binary = byteArray.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
  const base64 = globalThis.btoa(binary);
  return {
    data: base64,
    type: blob.type,
    size: blob.size
  };
}
async function deserializeBlob(serializedBlob) {
  const byteArray = Uint8Array.from(globalThis.atob(serializedBlob.data), (x) => x.charCodeAt(0));
  return new Blob([byteArray], { type: serializedBlob.type });
}
