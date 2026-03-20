import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeePortalService } from './employee-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';

@ApiTags('Portal do Funcionario')
@Controller('employee-portal')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class EmployeePortalController {
  constructor(private readonly portalService: EmployeePortalService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do funcionario logado' })
  getMyProfile(@Req() req: any) {
    return this.portalService.getMyProfile(req.user.id);
  }

  @Get('payslips')
  @ApiOperation({ summary: 'Listar holerites do funcionario logado' })
  getMyPayslips(@Req() req: any) {
    return this.portalService.getMyPayslips(req.user.id);
  }

  @Get('payslips/:id')
  @ApiOperation({ summary: 'Obter detalhes de um holerite' })
  getPayslipDetail(@Req() req: any, @Param('id') id: string) {
    return this.portalService.getPayslipDetail(req.user.id, id);
  }
}
