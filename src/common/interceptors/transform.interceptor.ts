// backend/src/common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * TransformInterceptor
 *
 * الـ Interceptor ده بيشتغل على كل الـ Responses الناجحة
 * وبيحولها إلى شكل موحد: { success: true, data: ..., timestamp: ... }
 *
 * ده بيسهل جداً على الـ Frontend في التعامل مع الـ API.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<{ success: boolean; data: unknown; timestamp: string }> {
    return next.handle().pipe(
      // map بيعدل على الـ data اللي راجعة من الـ Controller
      map((data: unknown) => ({
        success: true,
        data, // البيانات الأصلية اللي الـ Controller رجعها
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
