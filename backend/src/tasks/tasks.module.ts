import { Module } from '@nestjs/common';
import { ColumnsModule } from '../columns/columns.module';
import { ColumnLockRepository } from './repositories/column-lock.repository';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [ColumnsModule],
  controllers: [TasksController],
  providers: [TasksService, ColumnLockRepository],
})
export class TasksModule {}
