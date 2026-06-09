import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCommunityDto {
  @ApiProperty({ description: 'The name of the community' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'The description of the community' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'The picture of the community' })
  @IsOptional()
  @IsString()
  communityPicture?: string;
}
