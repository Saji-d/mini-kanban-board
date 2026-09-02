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
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@UseGuards(JwtAuthGuard, BoardMembershipGuard)
@Controller('boards/:boardId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Param('boardId') boardId: string) {
    return this.tasksService.findAllForBoard(boardId);
  }

  @RequireRole(BoardRole.EDITOR)
  @Post()
  create(@Param('boardId') boardId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(boardId, dto);
  }

  @RequireRole(BoardRole.EDITOR)
  @Patch(':taskId')
  update(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(boardId, taskId, dto);
  }

  @RequireRole(BoardRole.EDITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':taskId')
  remove(@Param('boardId') boardId: string, @Param('taskId') taskId: string) {
    return this.tasksService.remove(boardId, taskId);
  }

  @RequireRole(BoardRole.EDITOR)
  @Patch(':taskId/move')
  move(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.tasksService.move(boardId, taskId, dto);
  }
}
