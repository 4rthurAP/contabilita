import {
  Controller,
  Get,
  Post,
  Delete,
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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { RolesGuard } from '../tenant/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CertificateService } from './certificate.service';
import { UploadCertificateDto } from './dto/upload-certificate.dto';

@ApiTags('Certificados Digitais')
@Controller('certificates')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('Owner', 'Admin', 'Accountant')
@ApiBearerAuth()
export class CertificateController {
  constructor(private readonly certService: CertificateService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload de certificado digital A1 (.pfx/.p12)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        companyId: { type: 'string' },
        tipo: { type: 'string', enum: ['A1', 'A3'] },
        nome: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['file', 'companyId', 'tipo', 'password'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadCertificateDto,
  ) {
    return this.certService.upload(dto, file.buffer);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os certificados do tenant' })
  @ApiQuery({ name: 'companyId', required: false })
  findAll(@Query('companyId') companyId?: string) {
    if (companyId) return this.certService.findByCompany(companyId);
    return this.certService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um certificado' })
  findOne(@Param('id') id: string) {
    return this.certService.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover certificado' })
  @Roles('Owner', 'Admin')
  async remove(@Param('id') id: string) {
    await this.certService.remove(id);
    return { message: 'Certificado removido com sucesso' };
  }
}
