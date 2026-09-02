import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BoardRole } from '@prisma/client';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { BoardMembershipGuard } from '../common/guards/board-membership.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@ApiTags('boards')
@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBoardDto) {
    return this.boardsService.createBoard(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.boardsService.listBoardsForUser(user.id);
  }

  @UseGuards(BoardMembershipGuard)
  @Get(':boardId')
  getOne(@Param('boardId') boardId: string) {
    return this.boardsService.getBoardDetail(boardId);
  }

  @UseGuards(BoardMembershipGuard)
  @RequireRole(BoardRole.EDITOR)
  @Patch(':boardId')
  update(@Param('boardId') boardId: string, @Body() dto: UpdateBoardDto) {
    return this.boardsService.updateBoard(boardId, dto);
  }

  @UseGuards(BoardMembershipGuard)
  @RequireRole(BoardRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':boardId')
  remove(@Param('boardId') boardId: string) {
    return this.boardsService.deleteBoard(boardId);
  }

  @UseGuards(BoardMembershipGuard)
  @Get(':boardId/members')
  listMembers(@Param('boardId') boardId: string) {
    return this.boardsService.listMembers(boardId);
  }

  @UseGuards(BoardMembershipGuard)
  @RequireRole(BoardRole.OWNER)
  @Post(':boardId/members')
  addMember(@Param('boardId') boardId: string, @Body() dto: AddMemberDto) {
    return this.boardsService.addMember(boardId, dto);
  }

  @UseGuards(BoardMembershipGuard)
  @RequireRole(BoardRole.OWNER)
  @Patch(':boardId/members/:memberId')
  updateMemberRole(
    @Param('boardId') boardId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.boardsService.updateMemberRole(boardId, memberId, dto);
  }

  @UseGuards(BoardMembershipGuard)
  @RequireRole(BoardRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':boardId/members/:memberId')
  removeMember(
    @Param('boardId') boardId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.boardsService.removeMember(boardId, memberId);
  }
}
