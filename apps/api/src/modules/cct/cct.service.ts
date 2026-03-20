import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CNAE_ANEXO_MAP,
  getAnexoTable,
  calcularAliquotaEfetiva,
  PIS_COFINS_NCM_TABLE,
  ALIQUOTA_PIS_CUMULATIVO,
  ALIQUOTA_COFINS_CUMULATIVO,
  ALIQUOTA_PIS_NAO_CUMULATIVO,
  ALIQUOTA_COFINS_NAO_CUMULATIVO,
} from '@contabilita/shared';

@Injectable()
export class CctService {
  /**
   * Compara a carga tributaria estimada entre os 3 regimes tributarios
   * para um dado faturamento e despesas.
   */
  compareRegimes(revenue: number, expenses: number) {
    // Simples Nacional - aliquota efetiva sobre receita (Anexo III como referencia para servicos)
    const simplesAnexoIII = getAnexoTable('III');
    const simplesAliquotaEfetiva = calcularAliquotaEfetiva(revenue * 12, simplesAnexoIII);
    const simplesTotal = revenue * simplesAliquotaEfetiva;

    // Lucro Presumido - base 32% para servicos
    const basePresumida = revenue * 0.32;
    const irpjPresumido = basePresumida * 0.15;
    const adicionalIr = basePresumida > 20000 ? (basePresumida - 20000) * 0.1 : 0;
    const csllPresumido = basePresumida * 0.09;
    const pisPresumido = revenue * ALIQUOTA_PIS_CUMULATIVO;
    const cofinsPresumido = revenue * ALIQUOTA_COFINS_CUMULATIVO;
    const presumidoTotal = irpjPresumido + adicionalIr + csllPresumido + pisPresumido + cofinsPresumido;

    // Lucro Real - base = lucro efetivo
    const lucro = revenue - expenses;
    const irpjReal = lucro > 0 ? lucro * 0.15 : 0;
    const adicionalIrReal = lucro > 20000 ? (lucro - 20000) * 0.1 : 0;
    const csllReal = lucro > 0 ? lucro * 0.09 : 0;
    const pisReal = revenue * ALIQUOTA_PIS_NAO_CUMULATIVO;
    const cofinsReal = revenue * ALIQUOTA_COFINS_NAO_CUMULATIVO;
    const realTotal = irpjReal + adicionalIrReal + csllReal + pisReal + cofinsReal;

    return {
      simplesNacional: {
        regime: 'Simples Nacional',
        aliquotaEfetiva: simplesAliquotaEfetiva,
        totalImpostos: Number(simplesTotal.toFixed(2)),
        detalhes: { aliquotaEfetiva: simplesAliquotaEfetiva, baseCalculo: revenue },
      },
      lucroPresumido: {
        regime: 'Lucro Presumido',
        aliquotaEfetiva: presumidoTotal / revenue,
        totalImpostos: Number(presumidoTotal.toFixed(2)),
        detalhes: {
          irpj: Number(irpjPresumido.toFixed(2)),
          adicionalIr: Number(adicionalIr.toFixed(2)),
          csll: Number(csllPresumido.toFixed(2)),
          pis: Number(pisPresumido.toFixed(2)),
          cofins: Number(cofinsPresumido.toFixed(2)),
        },
      },
      lucroReal: {
        regime: 'Lucro Real',
        aliquotaEfetiva: realTotal / revenue,
        totalImpostos: Number(realTotal.toFixed(2)),
        detalhes: {
          irpj: Number(irpjReal.toFixed(2)),
          adicionalIr: Number(adicionalIrReal.toFixed(2)),
          csll: Number(csllReal.toFixed(2)),
          pis: Number(pisReal.toFixed(2)),
          cofins: Number(cofinsReal.toFixed(2)),
          lucroBase: Number(lucro.toFixed(2)),
        },
      },
      melhorOpcao:
        simplesTotal <= presumidoTotal && simplesTotal <= realTotal
          ? 'Simples Nacional'
          : presumidoTotal <= realTotal
            ? 'Lucro Presumido'
            : 'Lucro Real',
    };
  }

  /**
   * Retorna aliquotas do Simples Nacional para um CNAE e receita 12 meses.
   */
  getSimplesRates(cnae: string, revenue: number) {
    const anexo = CNAE_ANEXO_MAP[cnae];
    if (!anexo) {
      throw new NotFoundException(`CNAE ${cnae} nao encontrado no mapa de anexos`);
    }

    const faixas = getAnexoTable(anexo);
    const aliquotaEfetiva = calcularAliquotaEfetiva(revenue, faixas);

    return {
      cnae,
      anexo: `Anexo ${anexo}`,
      receita12m: revenue,
      aliquotaEfetiva,
      valorEstimadoMensal: Number(((revenue / 12) * aliquotaEfetiva).toFixed(2)),
      faixas,
    };
  }

  /**
   * Retorna aliquotas PIS/COFINS para um NCM.
   */
  getPisCofinsRates(ncm: string) {
    const rate = PIS_COFINS_NCM_TABLE.find((r) => ncm.startsWith(r.ncm));
    if (!rate) {
      return {
        ncm,
        encontrado: false,
        padrao: {
          pis: ALIQUOTA_PIS_NAO_CUMULATIVO,
          cofins: ALIQUOTA_COFINS_NAO_CUMULATIVO,
          ipi: 0,
          cst: '01',
          descricao: 'Aliquota padrao nao-cumulativo',
        },
      };
    }

    return {
      encontrado: true,
      ...rate,
    };
  }
}
