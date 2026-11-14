"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    success;
    message;
    data;
    constructor(statusCode, data, message = 'Success') {
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
    }
    static send(res, statusCode, data, message = 'Success') {
        return res.status(statusCode).json({
            success: statusCode < 400,
            message,
            data,
        });
    }
    static ok(res, data, message = 'Success') {
        return ApiResponse.send(res, 200, data, message);
    }
    static created(res, data, message = 'Resource created successfully') {
        return ApiResponse.send(res, 201, data, message);
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=ApiResponse.js.map