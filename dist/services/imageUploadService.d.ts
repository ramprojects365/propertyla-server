import multer from 'multer';
export declare const upload: multer.Multer;
export declare const uploadAny: () => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadSingle: (fieldName?: string) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadArray: (fieldName?: string, maxCount?: number) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadFields: (fields: multer.Field[]) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadToSpaces: (file: Express.Multer.File, _folder?: string) => Promise<string>;
export declare const uploadMultipleToSpaces: (files: Express.Multer.File[], _folder?: string) => Promise<string[]>;
export declare const deleteFromSpaces: (fileUrl: string) => Promise<void>;
export declare const deleteMultipleFromSpaces: (fileUrls: string[]) => Promise<void>;
//# sourceMappingURL=imageUploadService.d.ts.map