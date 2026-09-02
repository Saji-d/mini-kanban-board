import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BoardRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRE_ROLE_KEY } from '../decorators/require-role.decorator';

const ROLE_RANK: Record<BoardRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  OWNER: 2,
};

/**
 * Proves the current user is a member of the board named by the ":boardId" route
 * param, and attaches the membership to the request. Only enforces a minimum role
 * when the route carries @RequireRole - otherwise any member (including VIEWER)
 * passes. Sub-resource ownership (does this task/column actually belong to this
 * board) is NOT checked here; that is done in the relevant service, since a guard
 * only sees route params, not request bodies.
 */
@Injectable()
export class BoardMembershipGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const boardId: string | undefined = request.params?.boardId;
    const userId: string | undefined = request.user?.id;

    if (!boardId || !userId) {
      throw new NotFoundException('Board not found');
    }

    const membership = await this.prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });

    // A missing membership and a missing board look identical to the caller,
    // so non-members can't use this endpoint to probe which board ids exist.
    if (!membership) {
      throw new NotFoundException('Board not found');
    }

    const requiredRole = this.reflector.getAllAndOverride<
      BoardRole | undefined
    >(REQUIRE_ROLE_KEY, [context.getHandler(), context.getClass()]);

    if (requiredRole && ROLE_RANK[membership.role] < ROLE_RANK[requiredRole]) {
      throw new ForbiddenException('Insufficient permissions for this board');
    }

    request.boardMembership = membership;
    return true;
  }
}
