import { Response } from 'express';
export declare class ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    constructor(statusCode: number, data: T, message?: string);
    static send<T>(res: Response, statusCode: number, data: T, message?: string): Response<any, Record<string, any>>;
    static ok<T>(res: Response, data: T, message?: string): Response<any, Record<string, any>>;
    static created<T>(res: Response, data: T, message?: string): Response<any, Record<string, any>>;
}
//# sourceMappingURL=ApiResponse.d.ts.map