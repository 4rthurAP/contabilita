import { PayrollCalcService } from './payroll-calc.service';
import Decimal from 'decimal.js';

describe('PayrollCalcService', () => {
  let service: PayrollCalcService;

  beforeEach(() => {
    service = new PayrollCalcService();
  });

  describe('calcularInss', () => {
    it('deve calcular INSS para salario na primeira faixa (R$ 1.000)', () => {
      const inss = service.calcularInss(new Decimal('1000'));
      // 1000 * 7.5% = 75
      expect(inss.toNumber()).toBe(75);
    });

    it('deve calcular INSS progressivo para R$ 3.000', () => {
      const inss = service.calcularInss(new Decimal('3000'));
      // Faixa 1: 1412 * 7.5% = 105.90
      // Faixa 2: (2666.68 - 1412) * 9% = 1254.68 * 9% = 112.92
      // Faixa 3: (3000 - 2666.68) * 12% = 333.32 * 12% = 40.00
      // Total = 258.82
      expect(inss.toNumber()).toBeCloseTo(258.82, 1);
    });

    it('deve calcular INSS para salario acima do teto (R$ 10.000)', () => {
      const inss = service.calcularInss(new Decimal('10000'));
      // Teto: R$ 7.786,02
      // Faixa 1: 1412 * 7.5% = 105.90
      // Faixa 2: 1254.68 * 9% = 112.92
      // Faixa 3: 1333.35 * 12% = 160.00
      // Faixa 4: (7786.02 - 4000.03) * 14% = 3785.99 * 14% = 530.04
      // Total = 908.86
      const inssTeto = service.calcularInss(new Decimal('7786.02'));
      expect(inss.toNumber()).toBe(inssTeto.toNumber());
    });

    it('deve retornar 0 para salario zero', () => {
      const inss = service.calcularInss(new Decimal('0'));
      expect(inss.toNumber()).toBe(0);
    });
  });

  describe('calcularIrrf', () => {
    it('deve retornar 0 para base isenta (ate R$ 2.259,20)', () => {
      const irrf = service.calcularIrrf(new Decimal('2000'));
      expect(irrf.toNumber()).toBe(0);
    });

    it('deve calcular IRRF para base de R$ 3.000 (faixa 15%)', () => {
      const irrf = service.calcularIrrf(new Decimal('3000'));
      // 3000 * 15% - 381.44 = 450 - 381.44 = 68.56
      expect(irrf.toNumber()).toBeCloseTo(68.56, 2);
    });

    it('deve calcular IRRF para base de R$ 5.000 (faixa 27.5%)', () => {
      const irrf = service.calcularIrrf(new Decimal('5000'));
      // 5000 * 27.5% - 896 = 1375 - 896 = 479
      expect(irrf.toNumber()).toBeCloseTo(479, 2);
    });
  });

  describe('calcularBaseIrrf', () => {
    it('deve deduzir INSS e dependentes da base', () => {
      const base = service.calcularBaseIrrf(
        new Decimal('5000'),
        new Decimal('500'),
        2, // 2 dependentes
      );
      // 5000 - 500 - (189.59 * 2) = 5000 - 500 - 379.18 = 4120.82
      expect(base.toNumber()).toBeCloseTo(4120.82, 2);
    });

    it('deve retornar 0 se base ficar negativa', () => {
      const base = service.calcularBaseIrrf(
        new Decimal('500'),
        new Decimal('400'),
        10,
      );
      expect(base.toNumber()).toBe(0);
    });
  });

  describe('calcularFgts', () => {
    it('deve calcular 8% do salario bruto', () => {
      const fgts = service.calcularFgts(new Decimal('5000'));
      expect(fgts.toNumber()).toBe(400);
    });
  });

  describe('calculate (integracao)', () => {
    it('deve calcular todos os encargos para R$ 5.000 sem dependentes', () => {
      const result = service.calculate(new Decimal('5000'), 0);

      expect(result.salarioBruto.toNumber()).toBe(5000);
      expect(result.inss.toNumber()).toBeGreaterThan(0);
      expect(result.irrf.toNumber()).toBeGreaterThan(0);
      expect(result.fgts.toNumber()).toBe(400);
      expect(result.salarioLiquido.toNumber()).toBeLessThan(5000);

      // salarioLiquido = bruto - inss - irrf
      const expectedLiquido = result.salarioBruto
        .minus(result.inss)
        .minus(result.irrf);
      expect(result.salarioLiquido.equals(expectedLiquido)).toBe(true);
    });

    it('deve reduzir IRRF com dependentes', () => {
      const semDep = service.calculate(new Decimal('5000'), 0);
      const comDep = service.calculate(new Decimal('5000'), 3);

      expect(comDep.irrf.toNumber()).toBeLessThan(semDep.irrf.toNumber());
      expect(comDep.salarioLiquido.toNumber()).toBeGreaterThan(semDep.salarioLiquido.toNumber());
    });
  });

  describe('calcularFerias', () => {
    it('deve calcular ferias com 1/3 constitucional', () => {
      const result = service.calcularFerias(new Decimal('3000'), 30, 0);

      expect(result.valorFerias.toNumber()).toBe(3000);
      expect(result.tercoConstitucional.toNumber()).toBe(1000);
      expect(result.total.toNumber()).toBe(4000);
    });

    it('deve calcular ferias proporcionais (20 dias)', () => {
      const result = service.calcularFerias(new Decimal('3000'), 20, 0);
      const valorDia = 3000 / 30;
      expect(result.valorFerias.toNumber()).toBeCloseTo(valorDia * 20, 1);
    });

    it('deve incluir abono pecuniario', () => {
      const result = service.calcularFerias(new Decimal('3000'), 20, 10);
      expect(result.abonoPecuniario.toNumber()).toBeGreaterThan(0);
      expect(result.total.toNumber()).toBe(
        result.valorFerias.plus(result.tercoConstitucional).plus(result.abonoPecuniario).toNumber(),
      );
    });
  });

  describe('calcular13o', () => {
    it('deve calcular 1a parcela como 50% do proporcional', () => {
      const valor = service.calcular13o(new Decimal('6000'), 12, 1);
      // 6000 * 12/12 / 2 = 3000
      expect(valor.toNumber()).toBe(3000);
    });

    it('deve calcular proporcional para menos de 12 meses', () => {
      const valor = service.calcular13o(new Decimal('6000'), 6, 1);
      // 6000 * 6/12 / 2 = 1500
      expect(valor.toNumber()).toBe(1500);
    });
  });
});
