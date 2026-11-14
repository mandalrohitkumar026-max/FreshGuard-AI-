import { Response } from 'express';

export class ApiResponse<T = any> {
  public success: boolean;
  public message: string;
  public data: T;

  constructor(statusCode: number, data: T, message = 'Success') {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }

  static send<T>(res: Response, statusCode: number, data: T, message = 'Success') {
    return res.status(statusCode).json({
      success: statusCode < 400,
      message,
      data,
    });
  }

  static ok<T>(res: Response, data: T, message = 'Success') {
    return ApiResponse.send(res, 200, data, message);
  }

  static created<T>(res: Response, data: T, message = 'Resource created successfully') {
    return ApiResponse.send(res, 201, data, message);
  }
}
