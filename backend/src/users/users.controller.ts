import {
  Controller,
  Get,
  NotFoundException,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { LookupUserQueryDto } from './dto/lookup-user-query.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Used by the "invite by email" flow when sharing a board: confirms a user
  // with this email is registered before the board owner adds them as a member.
  @Get('lookup')
  async lookup(
    @Query(new ValidationPipe({ transform: true })) query: LookupUserQueryDto,
  ) {
    const user = await this.usersService.findByEmail(query.email);
    if (!user) {
      throw new NotFoundException('No user with that email is registered');
    }
    return { id: user.id, email: user.email, name: user.name };
  }
}
