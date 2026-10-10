import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTodoDto, UpdateTodoDto } from '@gdgoc/contracts';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createTodoDto: CreateTodoDto) {
    return this.prisma.todo.create({
      data: {
        ...createTodoDto,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.todo.findMany({ where: { userId } });
  }

  async findOne(id: string, userId: string) {
    const todo = await this.prisma.todo.findFirst({ where: { id, userId } });
    if (!todo) throw new NotFoundException();
    return todo;
  }

  async update(id: string, userId: string, updateTodoDto: UpdateTodoDto) {
    await this.findOne(id, userId); // Ensure ownership
    return this.prisma.todo.update({
      where: { id },
      data: updateTodoDto,
    });
  }

  async reorder(userId: string, todoIds: string[]) {
    const existing = await this.prisma.todo.findMany({
      where: { id: { in: todoIds }, userId }
    });
    if (existing.length !== todoIds.length) {
      throw new NotFoundException();
    }
    const updates = todoIds.map((id, index) =>
      this.prisma.todo.update({
        where: { id },
        data: { position: index },
      })
    );
    await this.prisma.$transaction(updates);
    return this.findAll(userId);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Ensure ownership
    return this.prisma.todo.delete({ where: { id } });
  }
}
