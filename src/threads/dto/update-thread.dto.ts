import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
export class UpdateThreadDto {
  @ApiProperty({ description: 'The text of the thread' })
  @IsString()
  @IsNotEmpty()
  text!: string;
}
