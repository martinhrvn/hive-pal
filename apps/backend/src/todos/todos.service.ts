import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiaryScopeFilter } from '../interface/request-with.apiary';
import {
  apiaryReadScope,
  apiaryWriteAccessWhere,
  apiaryWriteScope,
} from '../common';
import { CreateTodo, UpdateTodo, TodoResponse } from 'shared-schemas';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  private mapTodoToResponse(todo: {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    completed: boolean;
    hiveId: string | null;
    apiaryId: string;
    createdAt: Date;
    hive?: { name: string } | null;
  }): TodoResponse {
    return {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      dueDate: todo.dueDate?.toISOString() ?? null,
      completed: todo.completed,
      hiveId: todo.hiveId,
      hiveName: todo.hive?.name ?? null,
      apiaryId: todo.apiaryId,
      createdAt: todo.createdAt.toISOString(),
    };
  }

  private async assertHiveBelongsToApiary(
    hiveId: string,
    apiaryId: string,
  ): Promise<void> {
    const hive = await this.prisma.hive.findFirst({
      where: { id: hiveId, apiary: { id: apiaryId } },
    });
    if (!hive) {
      throw new NotFoundException(
        `Hive with ID ${hiveId} not found or does not belong to this apiary`,
      );
    }
  }

  /**
   * Resolve the apiary a new todo belongs to and verify write access:
   * the hive's apiary when a hive is given, otherwise the selected apiary.
   */
  private async resolveTargetApiary(
    hiveId: string | null | undefined,
    filter: ApiaryScopeFilter,
  ): Promise<string> {
    if (hiveId) {
      const hive = await this.prisma.hive.findFirst({
        where: { id: hiveId, apiary: apiaryWriteScope(filter) },
        select: { apiaryId: true },
      });
      if (!hive?.apiaryId) {
        throw new NotFoundException(
          `Hive with ID ${hiveId} not found or you cannot edit its apiary`,
        );
      }
      return hive.apiaryId;
    }
    if (!filter.apiaryId) {
      throw new BadRequestException('Select an apiary to create a todo');
    }
    const apiary = await this.prisma.apiary.findFirst({
      where: { id: filter.apiaryId, ...apiaryWriteAccessWhere(filter.userId) },
      select: { id: true },
    });
    if (!apiary) {
      throw new NotFoundException(
        `Apiary with ID ${filter.apiaryId} not found or you cannot edit it`,
      );
    }
    return apiary.id;
  }

  async create(
    createTodoDto: CreateTodo,
    filter: ApiaryScopeFilter,
  ): Promise<TodoResponse> {
    const apiaryId = await this.resolveTargetApiary(
      createTodoDto.hiveId,
      filter,
    );

    const todo = await this.prisma.todo.create({
      data: {
        title: createTodoDto.title,
        description: createTodoDto.description ?? null,
        dueDate: createTodoDto.dueDate ? new Date(createTodoDto.dueDate) : null,
        completed: createTodoDto.completed ?? false,
        hiveId: createTodoDto.hiveId ?? null,
        apiaryId,
      },
      include: { hive: { select: { name: true } } },
    });
    return this.mapTodoToResponse(todo);
  }

  async findAll(
    filter: ApiaryScopeFilter,
    params?: { completed?: boolean; hiveId?: string },
  ): Promise<TodoResponse[]> {
    const todos = await this.prisma.todo.findMany({
      where: {
        apiary: apiaryReadScope(filter),
        ...(params?.completed !== undefined && { completed: params.completed }),
        ...(params?.hiveId && { hiveId: params.hiveId }),
      },
      include: { hive: { select: { name: true } } },
      orderBy: [
        { completed: 'asc' },
        { dueDate: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
    });
    return todos.map((todo) => this.mapTodoToResponse(todo));
  }

  async findOne(id: string, filter: ApiaryScopeFilter): Promise<TodoResponse> {
    const todo = await this.prisma.todo.findFirst({
      where: { id, apiary: apiaryReadScope(filter) },
      include: { hive: { select: { name: true } } },
    });
    if (!todo) throw new NotFoundException(`Todo with ID ${id} not found`);
    return this.mapTodoToResponse(todo);
  }

  async update(
    id: string,
    updateTodoDto: UpdateTodo,
    filter: ApiaryScopeFilter,
  ): Promise<TodoResponse> {
    // Writes authorize against the todo's own apiary; the header is ignored.
    const existingTodo = await this.prisma.todo.findFirst({
      where: { id, apiary: apiaryWriteScope(filter) },
    });
    if (!existingTodo)
      throw new NotFoundException(`Todo with ID ${id} not found`);

    if (updateTodoDto.hiveId) {
      await this.assertHiveBelongsToApiary(
        updateTodoDto.hiveId,
        existingTodo.apiaryId,
      );
    }

    const updatedTodo = await this.prisma.todo.update({
      where: { id },
      data: {
        title: updateTodoDto.title,
        description:
          updateTodoDto.description === undefined
            ? undefined
            : updateTodoDto.description,
        dueDate:
          updateTodoDto.dueDate === undefined
            ? undefined
            : updateTodoDto.dueDate
              ? new Date(updateTodoDto.dueDate)
              : null,
        completed: updateTodoDto.completed,
        hiveId:
          updateTodoDto.hiveId === undefined
            ? undefined
            : (updateTodoDto.hiveId ?? null),
      },
      include: { hive: { select: { name: true } } },
    });
    return this.mapTodoToResponse(updatedTodo);
  }

  async remove(id: string, filter: ApiaryScopeFilter) {
    const existingTodo = await this.prisma.todo.findFirst({
      where: { id, apiary: apiaryWriteScope(filter) },
    });
    if (!existingTodo)
      throw new NotFoundException(`Todo with ID ${id} not found`);
    return this.prisma.todo.delete({ where: { id } });
  }
}
