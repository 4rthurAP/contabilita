import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EmployeeService } from '../services/employee.service';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../tenant/guards/tenant.guard';

@ApiTags('Funcionarios')
@Controller('companies/:companyId/employees')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar funcionario' })
  create(@Param('companyId') companyId: string, @Body() dto: CreateEmployeeDto) {
    return this.employeeService.create(companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar funcionarios' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Param('companyId') companyId: string, @Query('status') status?: string) {
    return this.employeeService.findAll(companyId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter funcionario por ID' })
  findOne(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.employeeService.findById(companyId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar funcionario' })
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateEmployeeDto>,
  ) {
    return this.employeeService.update(companyId, id, dto);
  }
}
