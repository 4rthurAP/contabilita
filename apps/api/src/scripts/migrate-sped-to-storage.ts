/**
 * Script de migracao: move fileContent de obligations do MongoDB para S3/local storage.
 *
 * Uso: npx ts-node -r tsconfig-paths/register apps/api/src/scripts/migrate-sped-to-storage.ts
 *
 * Passos:
 * 1. Busca obligations com fileContent preenchido e sem fileKey
 * 2. Faz upload do conteudo para o StorageService
 * 3. Salva o fileKey no documento
 * 4. Opcionalmente limpa fileContent (passe --clear para ativar)
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { StorageService } from '../modules/storage/storage.service';
import { Obligation } from '../modules/obligations/schemas/obligation.schema';
import { Model } from 'mongoose';

async function migrate() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const obligationModel = app.get<Model<any>>(getModelToken(Obligation.name));
  const storageService = app.get(StorageService);
  const clearContent = process.argv.includes('--clear');

  console.log('Buscando obligations com fileContent e sem fileKey...');

  const obligations = await obligationModel.find({
    fileContent: { $exists: true, $nin: [null, ''] },
    $or: [{ fileKey: { $exists: false } }, { fileKey: null }],
  });

  console.log(`Encontradas ${obligations.length} obligations para migrar`);

  let migrated = 0;
  let errors = 0;

  for (const obl of obligations) {
    try {
      const buffer = Buffer.from(obl.fileContent, 'utf-8');
      const fileName = obl.fileName || `${obl.tipo}_${obl.competencia.replace('/', '_')}.txt`;
      const fileKey = await storageService.upload(buffer, {
        tenantId: obl.tenantId.toString(),
        folder: 'sped',
        fileName,
        contentType: fileName.endsWith('.xml') ? 'application/xml' : 'text/plain',
      });

      const update: any = { fileKey };
      if (clearContent) {
        update.$unset = { fileContent: 1 };
      }

      await obligationModel.updateOne({ _id: obl._id }, update);
      migrated++;

      if (migrated % 50 === 0) {
        console.log(`  Progresso: ${migrated}/${obligations.length}`);
      }
    } catch (err) {
      errors++;
      console.error(`  Erro migrando ${obl._id} (${obl.tipo} ${obl.competencia}):`, err);
    }
  }

  console.log(`\nMigracao concluida: ${migrated} ok, ${errors} erros`);
  if (!clearContent) {
    console.log('Nota: fileContent mantido. Rode com --clear para remover apos verificar.');
  }

  await app.close();
}

migrate().catch((err) => {
  console.error('Erro fatal na migracao:', err);
  process.exit(1);
});
