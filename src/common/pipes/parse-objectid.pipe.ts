// backend/src/common/pipes/parse-objectid.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<
  string,
  Types.ObjectId
> {
  transform(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`Invalid ObjectId: ${value}`);
    }
    return new Types.ObjectId(value);
  }
}
// Example usage in a controller:

// @Get(':id')
// async findOne(
//   @Param('id', ParseObjectIdPipe) id: Types.ObjectId
// ) {
//   return this.threadsService.findOne(id);
// }
