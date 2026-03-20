import { Injectable } from '@nestjs/common';
import { RegimeTributario } from '@contabilita/shared';
import { TaxCalculationStrategy } from './tax-calculation.strategy';
import { SimplesNacionalStrategy } from './simples-nacional.strategy';
import { LucroPresumidoStrategy } from './lucro-presumido.strategy';
import { LucroRealStrategy } from './lucro-real.strategy';

/**
 * Factory que seleciona a estrategia de calculo de impostos
 * com base no regime tributario da empresa.
 */
@Injectable()
export class TaxCalculationFactory {
  private strategies: Map<RegimeTributario, TaxCalculationStrategy>;

  constructor() {
    this.strategies = new Map([
      [RegimeTributario.SimplesNacional, new SimplesNacionalStrategy()],
      [RegimeTributario.LucroPresumido, new LucroPresumidoStrategy()],
      [RegimeTributario.LucroReal, new LucroRealStrategy()],
      // Imune e Isenta usam estrategia simplificada (sem impostos significativos)
      [RegimeTributario.Imune, new SimplesNacionalStrategy()],
      [RegimeTributario.Isenta, new SimplesNacionalStrategy()],
    ]);
  }

  getStrategy(regime: RegimeTributario): TaxCalculationStrategy {
    const strategy = this.strategies.get(regime);
    if (!strategy) {
      throw new Error(`Estrategia de calculo nao implementada para regime: ${regime}`);
    }
    return strategy;
  }
}
