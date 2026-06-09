import { IsNotEmpty, IsString } from 'class-validator';

export class AddMemberAdminDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;
}
