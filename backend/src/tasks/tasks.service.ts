import { Injectable, NotFoundException } from '@nestjs/common';
import { ColumnsService } from '../columns/columns.service';
import {
  clampIndex,
  computeInsertPosition,
  nextAppendPosition,
  POSITION_EPSILON,
  renormalizedPositions,
} from '../common/ordering/position.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ColumnLockRepository } from './repositories/column-lock.repository';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly columnsService: ColumnsService,
    private readonly columnLockRepository: ColumnLockRepository,
  ) {}

  async findAllForBoard(boardId: string) {
    return this.prisma.task.findMany({
      where: { column: { boardId } },
      orderBy: { position: 'asc' },
    });
  }

  async create(boardId: string, dto: CreateTaskDto) {
    await this.columnsService.getColumnInBoardOrThrow(boardId, dto.columnId);

    const lastTask = await this.prisma.task.findFirst({
      where: { columnId: dto.columnId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return this.prisma.task.create({
      data: {
        columnId: dto.columnId,
        title: dto.title,
        description: dto.description,
        position: nextAppendPosition(lastTask?.position),
      },
    });
  }

  async update(boardId: string, taskId: string, dto: UpdateTaskDto) {
    await this.getTaskInBoardOrThrow(boardId, taskId);
    return this.prisma.task.update({ where: { id: taskId }, data: dto });
  }

  async remove(boardId: string, taskId: string) {
    await this.getTaskInBoardOrThrow(boardId, taskId);
    await this.prisma.task.delete({ where: { id: taskId } });
  }

  async move(boardId: string, taskId: string, dto: MoveTaskDto) {
    const task = await this.getTaskInBoardOrThrow(boardId, taskId);
    // dto.destinationColumnId is the only trusted client input here - the
    // source column/board is re-derived from the task itself above, and the
    // destination is independently resolved and board-checked below, so a
    // legitimate editor on one board can never reference another board's
    // column even if they guess/tamper with an id.
    await this.columnsService.getColumnInBoardOrThrow(
      boardId,
      dto.destinationColumnId,
    );

    const sourceColumnId = task.columnId;
    const destinationColumnId = dto.destinationColumnId;

    return this.prisma.$transaction(async (tx) => {
      await this.columnLockRepository.lockColumnsForUpdate(tx, [
        sourceColumnId,
        destinationColumnId,
      ]);

      const siblings = await tx.task.findMany({
        where: { columnId: destinationColumnId, id: { not: taskId } },
        orderBy: { position: 'asc' },
        select: { id: true, position: true },
      });

      const clampedIndex = clampIndex(dto.targetIndex, siblings.length);
      const initialResult = computeInsertPosition(siblings, clampedIndex);
      let newPosition = initialResult.position;

      if (initialResult.needsRenormalization) {
        const freshPositions = renormalizedPositions(siblings.length);
        await Promise.all(
          siblings.map((sibling, index) =>
            tx.task.update({
              where: { id: sibling.id },
              data: { position: freshPositions[index] },
            }),
          ),
        );
        const renormalizedSiblings = siblings.map((sibling, index) => ({
          id: sibling.id,
          position: freshPositions[index],
        }));
        newPosition = computeInsertPosition(
          renormalizedSiblings,
          clampedIndex,
        ).position;
      }

      const isNoOp =
        destinationColumnId === sourceColumnId &&
        Math.abs(newPosition - task.position) < POSITION_EPSILON;

      if (isNoOp) {
        return task;
      }

      return tx.task.update({
        where: { id: taskId },
        data: { columnId: destinationColumnId, position: newPosition },
      });
    });
  }

  /**
   * Confirms taskId actually belongs to boardId (via its column) - re-derives
   * the owning board from the task itself rather than trusting any client-
   * supplied source, closing the IDOR gap a route-level guard alone leaves.
   */
  async getTaskInBoardOrThrow(boardId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });
    if (!task || task.column.boardId !== boardId) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }
}
