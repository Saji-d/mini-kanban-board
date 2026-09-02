import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BoardRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class BoardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async createBoard(ownerId: string, dto: CreateBoardDto) {
    return this.prisma.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: {
          title: dto.title,
          description: dto.description,
          ownerId,
        },
      });

      await tx.boardMember.create({
        data: { boardId: board.id, userId: ownerId, role: BoardRole.OWNER },
      });

      return board;
    });
  }

  async listBoardsForUser(userId: string) {
    const memberships = await this.prisma.boardMember.findMany({
      where: { userId },
      include: { board: true },
      orderBy: { board: { updatedAt: 'desc' } },
    });

    return memberships.map((membership) => ({
      ...membership.board,
      role: membership.role,
    }));
  }

  async getBoardDetail(boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: { tasks: { orderBy: { position: 'asc' } } },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async updateBoard(boardId: string, dto: UpdateBoardDto) {
    await this.getBoardOrThrow(boardId);
    return this.prisma.board.update({ where: { id: boardId }, data: dto });
  }

  async deleteBoard(boardId: string) {
    await this.getBoardOrThrow(boardId);
    await this.prisma.board.delete({ where: { id: boardId } });
  }

  async listMembers(boardId: string) {
    return this.prisma.boardMember.findMany({
      where: { boardId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(boardId: string, dto: AddMemberDto) {
    const targetUser = await this.usersService.findByEmail(dto.email);
    if (!targetUser) {
      throw new NotFoundException('No user with that email is registered');
    }

    const existing = await this.prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: targetUser.id } },
    });
    if (existing) {
      throw new ConflictException(
        'That user is already a member of this board',
      );
    }

    return this.prisma.boardMember.create({
      data: { boardId, userId: targetUser.id, role: dto.role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async updateMemberRole(
    boardId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const member = await this.getMemberInBoardOrThrow(boardId, memberId);

    if (member.role === BoardRole.OWNER && dto.role !== BoardRole.OWNER) {
      await this.assertNotLastOwner(boardId);
    }

    return this.prisma.boardMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async removeMember(boardId: string, memberId: string) {
    const member = await this.getMemberInBoardOrThrow(boardId, memberId);

    if (member.role === BoardRole.OWNER) {
      await this.assertNotLastOwner(boardId);
    }

    await this.prisma.boardMember.delete({ where: { id: memberId } });
  }

  private async getBoardOrThrow(boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    return board;
  }

  // Confirms memberId actually belongs to boardId - without this, an OWNER of
  // board A could pass a memberId that belongs to board B and manipulate it.
  private async getMemberInBoardOrThrow(boardId: string, memberId: string) {
    const member = await this.prisma.boardMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.boardId !== boardId) {
      throw new NotFoundException('Board member not found');
    }
    return member;
  }

  private async assertNotLastOwner(boardId: string) {
    const ownerCount = await this.prisma.boardMember.count({
      where: { boardId, role: BoardRole.OWNER },
    });
    if (ownerCount <= 1) {
      throw new ForbiddenException(
        'A board must always have at least one owner',
      );
    }
  }
}
