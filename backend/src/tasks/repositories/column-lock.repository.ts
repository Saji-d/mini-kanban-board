import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class ColumnLockRepository {
  /**
   * Row-locks the given columns for the rest of the transaction, in a
   * consistent (sorted) id order, so two concurrent moves touching the same
   * pair of columns in opposite order can't deadlock each other. Prisma's
   * query builder has no FOR UPDATE, so this is raw, parameterized SQL,
   * kept isolated here rather than inline in TasksService.
   */
  async lockColumnsForUpdate(tx: TxClient, columnIds: string[]): Promise<void> {
    const uniqueSortedIds = Array.from(new Set(columnIds)).sort();
    if (uniqueSortedIds.length === 0) {
      return;
    }

    await tx.$queryRaw`
      SELECT id FROM "columns" WHERE id = ANY(${uniqueSortedIds}::text[]) ORDER BY id FOR UPDATE
    `;
  }
}
