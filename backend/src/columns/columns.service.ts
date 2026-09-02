import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { nextAppendPosition } from '../common/ordering/position.util';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForBoard(boardId: string) {
    return this.prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });
  }

  async create(boardId: string, dto: CreateColumnDto) {
    const lastColumn = await this.prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return this.prisma.column.create({
      data: {
        boardId,
        name: dto.name,
        position: nextAppendPosition(lastColumn?.position),
      },
    });
  }

  async update(boardId: string, columnId: string, dto: UpdateColumnDto) {
    await this.getColumnInBoardOrThrow(boardId, columnId);
    return this.prisma.column.update({
      where: { id: columnId },
      data: { name: dto.name },
    });
  }

  async remove(boardId: string, columnId: string) {
    await this.getColumnInBoardOrThrow(boardId, columnId);
    await this.prisma.column.delete({ where: { id: columnId } });
  }

  /**
   * Confirms columnId actually belongs to boardId. Used both by this
   * service's own mutations and by TasksService when validating a task's
   * source/destination column - closes the gap a route-level guard can't,
   * since a guard only ever sees :boardId from the URL, not body fields.
   */
  async getColumnInBoardOrThrow(boardId: string, columnId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
    });
    if (!column || column.boardId !== boardId) {
      throw new NotFoundException('Column not found');
    }
    return column;
  }
}
