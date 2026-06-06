// backend/src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HttpExceptionFilter
 *
 * الفيلتر ده بيحصل على كل الأخطاء (Exceptions) اللي بتحصل في الباك إند
 * وبيوحد شكل الـ Error Response عشان الـ Frontend يقدر يتعامل معاه بسهولة.
 */
@Catch(HttpException) // بيشتغل على كل HttpException
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // نحول ArgumentsHost إلى HTTP Context عشان نقدر نوصل للـ Request والـ Response
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // نجيب كود الخطأ (400, 401, 404, 500 ...)
    const status = exception.getStatus();

    // نحاول نستخرج الرسالة من الـ exception بطريقة آمنة
    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? exceptionResponse['message']
        : exception.message;

    // نرجع الـ Error Response بالشكل الموحد
    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: Array.isArray(message) ? message[0] : message, // لو array بناخد أول رسالة
      error: exception.name,
    });
  }
}
