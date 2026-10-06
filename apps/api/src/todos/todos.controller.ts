import { Controller, Get, Post, Body, Param, Put, Delete, Req } from '@nestjs/common';
import { TodosService } from './todos.service.js';
import type { CreateTodoDto, UpdateTodoDto } from '@gdgoc/contracts';
import type { Request } from 'express';

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  create(@Req() req: Request, @Body() createTodoDto: CreateTodoDto) {
    const userId = (req as any).user.sub;
    return this.todosService.create(userId, createTodoDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.todosService.findAll(userId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.sub;
    return this.todosService.findOne(id, userId);
  }

  @Put(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto) {
    const userId = (req as any).user.sub;
    return this.todosService.update(id, userId, updateTodoDto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.sub;
    return this.todosService.remove(id, userId);
  }
}
