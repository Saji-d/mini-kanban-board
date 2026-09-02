import { IsEmail, IsEnum } from 'class-validator';
import { BoardRole } from '@prisma/client';

export class AddMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(BoardRole)
  role!: BoardRole;
}
