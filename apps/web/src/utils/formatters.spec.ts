import { describe, it, expect } from 'vitest';
import { formatCpf, formatCnpj, formatMoeda, formatCep } from './formatters';

describe('formatCpf', () => {
  it('deve formatar CPF corretamente', () => {
    expect(formatCpf('12345678901')).toBe('123.456.789-01');
  });
});

describe('formatCnpj', () => {
  it('deve formatar CNPJ corretamente', () => {
    expect(formatCnpj('12345678000199')).toBe('12.345.678/0001-99');
  });
});

describe('formatMoeda', () => {
  it('deve formatar valor monetario em BRL', () => {
    const result = formatMoeda(1234.56);
    expect(result).toContain('1.234,56');
  });

  it('deve aceitar string como entrada', () => {
    const result = formatMoeda('1000');
    expect(result).toContain('1.000,00');
  });

  it('deve formatar zero', () => {
    const result = formatMoeda(0);
    expect(result).toContain('0,00');
  });
});

describe('formatCep', () => {
  it('deve formatar CEP corretamente', () => {
    expect(formatCep('01001000')).toBe('01001-000');
  });
});
