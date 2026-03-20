import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  TABELA_INSS_2024,
  TABELA_IRRF_2024,
  DEDUCAO_DEPENDENTE_IRRF,
  ALIQUOTA_FGTS,
} from '@contabilita/shared';

export interface PayrollCalcResult {
  salarioBruto: Decimal;
  inss: Decimal;
  baseIrrf: Decimal;
  irrf: Decimal;
  fgts: Decimal;
  totalProventos: Decimal;
  totalDescontos: Decimal;
  salarioLiquido: Decimal;
}

/**
 * Motor de calculo da folha de pagamento.
 * Implementa calculo progressivo de INSS e IRRF conforme legislacao brasileira.
 */
@Injectable()
export class PayrollCalcService {
  /**
   * Calcula todos os encargos para um funcionario.
   */
  calculate(salarioBruto: Decimal, numDependentes: number): PayrollCalcResult {
    const inss = this.calcularInss(salarioBruto);
    const baseIrrf = this.calcularBaseIrrf(salarioBruto, inss, numDependentes);
    const irrf = this.calcularIrrf(baseIrrf);
    const fgts = this.calcularFgts(salarioBruto);

    const totalProventos = salarioBruto;
    const totalDescontos = inss.plus(irrf);
    const salarioLiquido = totalProventos.minus(totalDescontos);

    return {
      salarioBruto,
      inss,
      baseIrrf,
      irrf,
      fgts,
      totalProventos,
      totalDescontos,
      salarioLiquido,
    };
  }

  /**
   * INSS - Calculo progressivo por faixas.
   * Cada faixa aplica sua aliquota apenas sobre a parcela dentro da faixa.
   */
  calcularInss(salarioBruto: Decimal): Decimal {
    let totalInss = new Decimal(0);
    let salarioRestante = salarioBruto;
    let faixaAnterior = new Decimal(0);

    for (const faixa of TABELA_INSS_2024) {
      const teto = new Decimal(faixa.ate);
      const aliquota = new Decimal(faixa.aliquota);
      const faixaAtual = teto.minus(faixaAnterior);

      if (salarioRestante.lte(0)) break;

      const baseNaFaixa = Decimal.min(salarioRestante, faixaAtual);
      totalInss = totalInss.plus(baseNaFaixa.times(aliquota));

      salarioRestante = salarioRestante.minus(faixaAtual);
      faixaAnterior = teto;
    }

    return totalInss.toDecimalPlaces(2);
  }

  /**
   * Base de calculo do IRRF = salario bruto - INSS - deducao por dependentes.
   */
  calcularBaseIrrf(salarioBruto: Decimal, inss: Decimal, numDependentes: number): Decimal {
    const deducaoDependentes = new Decimal(DEDUCAO_DEPENDENTE_IRRF).times(numDependentes);
    const base = salarioBruto.minus(inss).minus(deducaoDependentes);
    return Decimal.max(base, new Decimal(0)).toDecimalPlaces(2);
  }

  /**
   * IRRF - Calculo pela tabela progressiva com deducao.
   */
  calcularIrrf(baseCalculo: Decimal): Decimal {
    for (const faixa of TABELA_IRRF_2024) {
      if (baseCalculo.lte(faixa.ate)) {
        const aliquota = new Decimal(faixa.aliquota);
        const deducao = new Decimal(faixa.deducao);
        const irrf = baseCalculo.times(aliquota).minus(deducao);
        return Decimal.max(irrf, new Decimal(0)).toDecimalPlaces(2);
      }
    }
    return new Decimal(0);
  }

  /**
   * FGTS - 8% sobre a remuneracao bruta.
   * Nao e descontado do funcionario, e encargo do empregador.
   */
  calcularFgts(salarioBruto: Decimal): Decimal {
    return salarioBruto.times(ALIQUOTA_FGTS).toDecimalPlaces(2);
  }

  /**
   * Calculo de ferias: salario + 1/3 constitucional.
   */
  calcularFerias(salarioBruto: Decimal, diasFerias: number, abonosPecuniarios: number): {
    valorFerias: Decimal;
    tercoConstitucional: Decimal;
    abonoPecuniario: Decimal;
    total: Decimal;
  } {
    const valorDia = salarioBruto.dividedBy(30);
    const valorFerias = valorDia.times(diasFerias).toDecimalPlaces(2);
    const tercoConstitucional = valorFerias.dividedBy(3).toDecimalPlaces(2);
    const abonoPecuniario = valorDia.times(abonosPecuniarios).toDecimalPlaces(2);
    const total = valorFerias.plus(tercoConstitucional).plus(abonoPecuniario);

    return { valorFerias, tercoConstitucional, abonoPecuniario, total };
  }

  /**
   * Calculo de 13o salario.
   * 1a parcela: 50% do salario (sem descontos)
   * 2a parcela: restante com descontos de INSS e IRRF
   */
  calcular13o(salarioBruto: Decimal, mesesTrabalhados: number, parcela: 1 | 2): Decimal {
    const proporcional = salarioBruto.times(mesesTrabalhados).dividedBy(12).toDecimalPlaces(2);
    if (parcela === 1) {
      return proporcional.dividedBy(2).toDecimalPlaces(2);
    }
    return proporcional; // 2a parcela e o valor integral (descontos calculados sobre total)
  }
}
