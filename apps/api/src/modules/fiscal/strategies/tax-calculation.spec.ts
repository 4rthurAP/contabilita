import Decimal from 'decimal.js';
import { SimplesNacionalStrategy } from './simples-nacional.strategy';
import { LucroPresumidoStrategy } from './lucro-presumido.strategy';
import { LucroRealStrategy } from './lucro-real.strategy';
import { TaxCalculationFactory } from './tax-calculation.factory';
import { RegimeTributario } from '@contabilita/shared';

describe('Tax Calculation Strategies', () => {
  describe('SimplesNacionalStrategy', () => {
    const strategy = new SimplesNacionalStrategy();

    it('deve retornar PIS e COFINS zerados (embutidos no DAS)', () => {
      const taxes = strategy.calculateItemTaxes({
        valorTotal: new Decimal('1000'),
        isServico: false,
        cfop: '5102',
        ncm: '84713012',
      });

      const pis = taxes.find((t) => t.tipo === 'pis');
      const cofins = taxes.find((t) => t.tipo === 'cofins');

      expect(pis).toBeDefined();
      expect(pis!.valor).toBe('0');
      expect(cofins).toBeDefined();
      expect(cofins!.valor).toBe('0');
    });

    it('deve calcular ISS para servicos', () => {
      const taxes = strategy.calculateItemTaxes({
        valorTotal: new Decimal('1000'),
        isServico: true,
        cfop: '5933',
        ncm: '',
      });

      const iss = taxes.find((t) => t.tipo === 'iss');
      expect(iss).toBeDefined();
      expect(parseFloat(iss!.valor)).toBe(30); // 3% de 1000
    });
  });

  describe('LucroPresumidoStrategy', () => {
    const strategy = new LucroPresumidoStrategy();

    it('deve calcular PIS cumulativo (0.65%)', () => {
      const taxes = strategy.calculateItemTaxes({
        valorTotal: new Decimal('10000'),
        isServico: false,
        cfop: '5102',
        ncm: '84713012',
      });

      const pis = taxes.find((t) => t.tipo === 'pis');
      expect(pis).toBeDefined();
      expect(parseFloat(pis!.valor)).toBe(65); // 0.65% de 10000
    });

    it('deve calcular COFINS cumulativo (3%)', () => {
      const taxes = strategy.calculateItemTaxes({
        valorTotal: new Decimal('10000'),
        isServico: false,
        cfop: '5102',
        ncm: '84713012',
      });

      const cofins = taxes.find((t) => t.tipo === 'cofins');
      expect(cofins).toBeDefined();
      expect(parseFloat(cofins!.valor)).toBe(300); // 3% de 10000
    });

    it('deve calcular ICMS para mercadorias (18%)', () => {
      const taxes = strategy.calculateItemTaxes({
        valorTotal: new Decimal('1000'),
        isServico: false,
        cfop: '5102',
        ncm: '84713012',
      });

      const icms = taxes.find((t) => t.tipo === 'icms');
      expect(icms).toBeDefined();
      expect(parseFloat(icms!.valor)).toBe(180);
    });

    it('deve calcular ISS para servicos (5%)', () => {
      const taxes = strategy.calculateItemTaxes({
        valorTotal: new Decimal('1000'),
        isServico: true,
        cfop: '5933',
        ncm: '',
      });

      const iss = taxes.find((t) => t.tipo === 'iss');
      const icms = taxes.find((t) => t.tipo === 'icms');
      expect(iss).toBeDefined();
      expect(parseFloat(iss!.valor)).toBe(50);
      expect(icms).toBeUndefined(); // Servico nao tem ICMS
    });
  });

  describe('LucroRealStrategy', () => {
    const strategy = new LucroRealStrategy();

    it('deve calcular PIS nao-cumulativo (1.65%)', () => {
      const taxes = strategy.calculateItemTaxes({
        valorTotal: new Decimal('10000'),
        isServico: false,
        cfop: '5102',
        ncm: '84713012',
      });

      const pis = taxes.find((t) => t.tipo === 'pis');
      expect(parseFloat(pis!.valor)).toBe(165);
    });

    it('deve calcular COFINS nao-cumulativo (7.6%)', () => {
      const taxes = strategy.calculateItemTaxes({
        valorTotal: new Decimal('10000'),
        isServico: false,
        cfop: '5102',
        ncm: '84713012',
      });

      const cofins = taxes.find((t) => t.tipo === 'cofins');
      expect(parseFloat(cofins!.valor)).toBe(760);
    });
  });

  describe('TaxCalculationFactory', () => {
    const factory = new TaxCalculationFactory();

    it('deve retornar SimplesNacionalStrategy para Simples Nacional', () => {
      const strategy = factory.getStrategy(RegimeTributario.SimplesNacional);
      expect(strategy).toBeInstanceOf(SimplesNacionalStrategy);
    });

    it('deve retornar LucroPresumidoStrategy para Lucro Presumido', () => {
      const strategy = factory.getStrategy(RegimeTributario.LucroPresumido);
      expect(strategy).toBeInstanceOf(LucroPresumidoStrategy);
    });

    it('deve retornar LucroRealStrategy para Lucro Real', () => {
      const strategy = factory.getStrategy(RegimeTributario.LucroReal);
      expect(strategy).toBeInstanceOf(LucroRealStrategy);
    });
  });
});
