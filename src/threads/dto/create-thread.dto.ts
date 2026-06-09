import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateThreadDto {
  @ApiProperty({ description: 'The text of the thread' })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiProperty({ description: 'The parent thread of the thread' })
  @IsOptional()
  parentId?: string;
  @ApiProperty({ description: 'The parent thread of the thread' })
  @IsOptional()
  community?: string;
}
