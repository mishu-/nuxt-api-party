export interface SerializedBlob {
    data: string;
    type: string;
    size: number;
    name?: string;
    __type: 'blob';
}
export type SerializedFormDataValue = string | SerializedBlob | (string | SerializedBlob)[];
export interface SerializedFormData {
    [key: string]: SerializedFormDataValue;
    __type: 'form-data';
}
export declare function isFormData(obj: unknown): obj is FormData;
export declare function isSerializedFormData(obj: unknown): obj is SerializedFormData;
export declare function formDataToObject(formData: FormData): Promise<SerializedFormData>;
export declare function objectToFormData(obj: SerializedFormData): Promise<FormData>;
