import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class MoveTaskDto {
  @IsString()
  @IsNotEmpty()
  destinationColumnId!: string;

  /**
   * Desired index within the destination column's task list, counting only
   * the OTHER tasks in that column (i.e. as if the moving task were already
   * removed). Out-of-range values are clamped into range, not rejected.
   */
  @IsInt()
  targetIndex!: number;
}
