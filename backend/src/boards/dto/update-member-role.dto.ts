import { IsEnum } from 'class-validator';
import { BoardRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsEnum(BoardRole)
  role!: BoardRole;
}
