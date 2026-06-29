import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TodosService } from './todos.service';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { ApiaryPermissionGuard } from '../guards/apiary-permission.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';
import { CustomLoggerService } from '../logger/logger.service';
import { ZodValidation } from '../common';
import {
  createTodoSchema,
  updateTodoSchema,
  CreateTodo,
  UpdateTodo,
  TodoResponse,
} from 'shared-schemas';

@ApiTags('todos')
@UseGuards(JwtAuthGuard, ApiaryContextGuard, ApiaryPermissionGuard)
@Controller('todos')
@UseInterceptors(ClassSerializerInterceptor)
export class TodosController {
  constructor(
    private readonly todosService: TodosService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('TodosController');
  }

  @Post()
  @ApiCreatedResponse({ type: Object })
  @ZodValidation(createTodoSchema)
  create(
    @Body() createTodoDto: CreateTodo,
    @Req() req: RequestWithApiary,
  ): Promise<TodoResponse> {
    this.logger.log(`Creating todo in apiary ${req.apiaryId}`);
    return this.todosService.create(createTodoDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get()
  @ApiOkResponse({ type: Object, isArray: true })
  findAll(
    @Req() req: RequestWithApiary,
    @Query('completed') completed?: string,
    @Query('hiveId') hiveId?: string,
  ): Promise<TodoResponse[]> {
    this.logger.log(`Finding all todos in apiary ${req.apiaryId}`);
    return this.todosService.findAll(
      { apiaryId: req.apiaryId, userId: req.user.id },
      {
        completed: completed === undefined ? undefined : completed === 'true',
        hiveId,
      },
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: Object })
  findOne(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ): Promise<TodoResponse> {
    this.logger.log(`Finding todo with ID ${id} in apiary ${req.apiaryId}`);
    return this.todosService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Patch(':id')
  @ApiOkResponse({ type: Object })
  @ZodValidation(updateTodoSchema)
  update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodo,
    @Req() req: RequestWithApiary,
  ): Promise<TodoResponse> {
    this.logger.log(`Updating todo with ID ${id} in apiary ${req.apiaryId}`);
    return this.todosService.update(id, updateTodoDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id')
  @ApiOkResponse({ type: Object })
  remove(@Param('id') id: string, @Req() req: RequestWithApiary) {
    this.logger.log(`Removing todo with ID ${id} from apiary ${req.apiaryId}`);
    return this.todosService.remove(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
