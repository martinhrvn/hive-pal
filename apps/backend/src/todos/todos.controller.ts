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
import { ApiaryOptional } from '../guards/apiary-optional.decorator';
import { RequestWithApiaryScope } from '../interface/request-with.apiary';
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
  @ApiaryOptional()
  @ApiCreatedResponse({ type: Object })
  @ZodValidation(createTodoSchema)
  create(
    @Body() createTodoDto: CreateTodo,
    @Req() req: RequestWithApiaryScope,
  ): Promise<TodoResponse> {
    this.logger.log(`Creating todo in apiary ${req.apiaryId ?? 'ALL'}`);
    return this.todosService.create(createTodoDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get()
  @ApiaryOptional()
  @ApiOkResponse({ type: Object, isArray: true })
  findAll(
    @Req() req: RequestWithApiaryScope,
    @Query('completed') completed?: string,
    @Query('hiveId') hiveId?: string,
  ): Promise<TodoResponse[]> {
    this.logger.log(`Finding all todos in apiary ${req.apiaryId ?? 'ALL'}`);
    return this.todosService.findAll(
      {
        apiaryId: req.apiaryId,
        userId: req.user.id,
        allApiaries: req.allApiaries,
      },
      {
        completed: completed === undefined ? undefined : completed === 'true',
        hiveId,
      },
    );
  }

  @Get(':id')
  @ApiaryOptional()
  @ApiOkResponse({ type: Object })
  findOne(
    @Param('id') id: string,
    @Req() req: RequestWithApiaryScope,
  ): Promise<TodoResponse> {
    this.logger.log(
      `Finding todo with ID ${id} in apiary ${req.apiaryId ?? 'ALL'}`,
    );
    return this.todosService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
      allApiaries: req.allApiaries,
    });
  }

  @Patch(':id')
  @ApiaryOptional()
  @ApiOkResponse({ type: Object })
  @ZodValidation(updateTodoSchema)
  update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodo,
    @Req() req: RequestWithApiaryScope,
  ): Promise<TodoResponse> {
    this.logger.log(`Updating todo with ID ${id}`);
    return this.todosService.update(id, updateTodoDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id')
  @ApiaryOptional()
  @ApiOkResponse({ type: Object })
  remove(@Param('id') id: string, @Req() req: RequestWithApiaryScope) {
    this.logger.log(`Removing todo with ID ${id}`);
    return this.todosService.remove(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
