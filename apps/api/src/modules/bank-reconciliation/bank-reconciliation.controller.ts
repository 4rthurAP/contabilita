import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../tenant/guards/roles.guard';
import { AbilitiesGuard } from '../../common/guards/abilities.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CheckAbilities } from '../../common/decorators/check-abilities.decorator';
import { BankReconciliationService } from './services/bank-reconciliation.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { BankTransactionStatus } from './schemas/bank-transaction.schema';
import { TenantRole } from '@contabilita/shared';

@ApiTags('Conciliacao Bancaria')
@Controller('bank-reconciliation')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, AbilitiesGuard)
@Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Accountant)
@ApiBearerAuth()
export class BankReconciliationController {
  constructor(private readonly service: BankReconciliationService) {}

  // ── Bank Accounts ──────────────────────────────

  @Post('companies/:companyId/accounts')
  @CheckAbilities(['create', 'Account'])
  @ApiOperation({ summary: 'Criar conta bancaria' })
  createAccount(
    @Param('companyId') companyId: string,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.service.createBankAccount(companyId, dto);
  }

  @Get('companies/:companyId/accounts')
  @CheckAbilities(['read', 'Account'])
  @ApiOperation({ summary: 'Listar contas bancarias da empresa' })
  findAccounts(@Param('companyId') companyId: string) {
    return this.service.findBankAccounts(companyId);
  }

  // ── OFX Import ─────────────────────────────────

  @Post('companies/:companyId/accounts/:bankAccountId/import-ofx')
  @CheckAbilities(['create', 'Account'])
  @ApiOperation({ summary: 'Importar extrato OFX/OFC' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importOfx(
    @Param('companyId') companyId: string,
    @Param('bankAccountId') bankAccountId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    const content = file.buffer.toString('utf-8');
    return this.service.importOfx(companyId, bankAccountId, content);
  }

  // ── Transactions ───────────────────────────────

  @Get('companies/:companyId/accounts/:bankAccountId/transactions')
  @CheckAbilities(['read', 'Account'])
  @ApiOperation({ summary: 'Listar transacoes do extrato' })
  @ApiQuery({ name: 'status', required: false, enum: BankTransactionStatus })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  findTransactions(
    @Param('companyId') companyId: string,
    @Param('bankAccountId') bankAccountId: string,
    @Query('status') status?: BankTransactionStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
  ) {
    return this.service.findTransactions(companyId, bankAccountId, {
      status,
      startDate,
      endDate,
      page,
    });
  }

  @Get('companies/:companyId/accounts/:bankAccountId/summary')
  @CheckAbilities(['read', 'Account'])
  @ApiOperation({ summary: 'Resumo de conciliacao' })
  getSummary(
    @Param('companyId') companyId: string,
    @Param('bankAccountId') bankAccountId: string,
  ) {
    return this.service.getSummary(companyId, bankAccountId);
  }

  @Patch('transactions/:id/reconcile')
  @CheckAbilities(['update', 'Account'])
  @ApiOperation({ summary: 'Conciliar transacao manualmente' })
  reconcile(
    @Param('id') id: string,
    @Body() body: { journalEntryId?: string; invoiceId?: string },
  ) {
    return this.service.reconcile(id, body.journalEntryId, body.invoiceId);
  }

  @Patch('transactions/:id/ignore')
  @CheckAbilities(['update', 'Account'])
  @ApiOperation({ summary: 'Ignorar transacao' })
  ignore(@Param('id') id: string) {
    return this.service.ignore(id);
  }
}
