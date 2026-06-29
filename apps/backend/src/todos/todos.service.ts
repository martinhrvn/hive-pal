import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
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

  async create(
    createTodoDto: CreateTodo,
    filter: ApiaryUserFilter,
  ): Promise<TodoResponse> {
    if (createTodoDto.hiveId) {
      await this.assertHiveBelongsToApiary(
        createTodoDto.hiveId,
        filter.apiaryId,
      );
    }

    const todo = await this.prisma.todo.create({
      data: {
        title: createTodoDto.title,
        description: createTodoDto.description ?? null,
        dueDate: createTodoDto.dueDate ? new Date(createTodoDto.dueDate) : null,
        completed: createTodoDto.completed ?? false,
        hiveId: createTodoDto.hiveId ?? null,
        apiaryId: filter.apiaryId,
      },
      include: { hive: { select: { name: true } } },
    });
    return this.mapTodoToResponse(todo);
  }

  async findAll(
    filter: ApiaryUserFilter,
    params?: { completed?: boolean; hiveId?: string },
  ): Promise<TodoResponse[]> {
    const todos = await this.prisma.todo.findMany({
      where: {
        apiaryId: filter.apiaryId,
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

  async findOne(id: string, filter: ApiaryUserFilter): Promise<TodoResponse> {
    const todo = await this.prisma.todo.findFirst({
      where: { id, apiaryId: filter.apiaryId },
      include: { hive: { select: { name: true } } },
    });
    if (!todo) throw new NotFoundException(`Todo with ID ${id} not found`);
    return this.mapTodoToResponse(todo);
  }

  async update(
    id: string,
    updateTodoDto: UpdateTodo,
    filter: ApiaryUserFilter,
  ): Promise<TodoResponse> {
    const existingTodo = await this.prisma.todo.findFirst({
      where: { id, apiaryId: filter.apiaryId },
    });
    if (!existingTodo)
      throw new NotFoundException(`Todo with ID ${id} not found`);

    if (updateTodoDto.hiveId) {
      await this.assertHiveBelongsToApiary(
        updateTodoDto.hiveId,
        filter.apiaryId,
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

  async remove(id: string, filter: ApiaryUserFilter) {
    const existingTodo = await this.prisma.todo.findFirst({
      where: { id, apiaryId: filter.apiaryId },
    });
    if (!existingTodo)
      throw new NotFoundException(`Todo with ID ${id} not found`);
    return this.prisma.todo.delete({ where: { id } });
  }
}
