// backend/src/common/pipes/parse-objectid.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * ParseObjectIdPipe
 *
 * Pipe مخصص عشان يتحقق من صحة الـ MongoDB ObjectId
 * اللي بييجي في الـ URL (مثلاً: /threads/60f7b2c9a5d9e123456789ab)
 *
 * بيمنع أخطاء قبل ما توصل للـ Database ويرجع رسالة واضحة.
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<
  string,
  Types.ObjectId
> {
  /*
   * transform
   * @param value - الـ ID اللي جاي في الـ URL (string)
   * @returns ObjectId صالح
   */
  transform(value: string): Types.ObjectId {
    // نتأكد إن الـ string ده ObjectId صالح (24 حرف hex)
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`Invalid ObjectId: ${value}`);
    }

    // نحوله لـ ObjectId حقيقي عشان نستخدمه في الـ Queries
    return new Types.ObjectId(value);
  }
}
