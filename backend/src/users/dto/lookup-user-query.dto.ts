import { IsEmail } from 'class-validator';

export class LookupUserQueryDto {
  @IsEmail()
  email!: string;
}
