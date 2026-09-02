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
import { RequireRole } from '../common/decorators/require-role.decorator';
import { BoardMembershipGuard } from '../common/guards/board-membership.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@ApiTags('columns')
@UseGuards(JwtAuthGuard, BoardMembershipGuard)
@Controller('boards/:boardId/columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Get()
  findAll(@Param('boardId') boardId: string) {
    return this.columnsService.findAllForBoard(boardId);
  }

  @RequireRole(BoardRole.EDITOR)
  @Post()
  create(@Param('boardId') boardId: string, @Body() dto: CreateColumnDto) {
    return this.columnsService.create(boardId, dto);
  }

  @RequireRole(BoardRole.EDITOR)
  @Patch(':columnId')
  update(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.columnsService.update(boardId, columnId, dto);
  }

  @RequireRole(BoardRole.EDITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':columnId')
  remove(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
  ) {
    return this.columnsService.remove(boardId, columnId);
  }
}
