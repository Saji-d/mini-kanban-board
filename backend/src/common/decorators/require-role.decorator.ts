import { SetMetadata } from '@nestjs/common';
import { BoardRole } from '@prisma/client';

export const REQUIRE_ROLE_KEY = 'requireRole';

/**
 * Minimum board role required to access a route, enforced by BoardMembershipGuard.
 * Omit on an endpoint to require only board membership (any role) - this is how
 * read endpoints stay open to VIEWER while mutations declare EDITOR/OWNER.
 */
export const RequireRole = (role: BoardRole) =>
  SetMetadata(REQUIRE_ROLE_KEY, role);
