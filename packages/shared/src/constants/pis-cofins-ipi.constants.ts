/**
 * Aliquotas PIS/COFINS por NCM (NCMs mais comuns)
 * Regime nao-cumulativo (Lucro Real)
 */
export interface PisCofinsRate {
  ncm: string;
  descricao: string;
  pis: number;
  cofins: number;
  ipi: number;
  cst: string;
}

export const PIS_COFINS_NCM_TABLE: PisCofinsRate[] = [
  { ncm: '0201', descricao: 'Carnes bovinas frescas/refrigeradas', pis: 0.0165, cofins: 0.076, ipi: 0, cst: '01' },
  { ncm: '0402', descricao: 'Leite e creme de leite', pis: 0, cofins: 0, ipi: 0, cst: '04' },
  { ncm: '1001', descricao: 'Trigo e mistura de trigo', pis: 0, cofins: 0, ipi: 0, cst: '04' },
  { ncm: '1905', descricao: 'Produtos de padaria', pis: 0, cofins: 0, ipi: 0, cst: '06' },
  { ncm: '2106', descricao: 'Preparacoes alimenticias', pis: 0.0165, cofins: 0.076, ipi: 0, cst: '01' },
  { ncm: '2202', descricao: 'Bebidas nao alcoolicas', pis: 0.0365, cofins: 0.1685, ipi: 0.04, cst: '01' },
  { ncm: '2710', descricao: 'Oleos de petroleo', pis: 0.0165, cofins: 0.076, ipi: 0, cst: '01' },
  { ncm: '3004', descricao: 'Medicamentos', pis: 0.0165, cofins: 0.076, ipi: 0, cst: '01' },
  { ncm: '3926', descricao: 'Obras de plastico', pis: 0.0165, cofins: 0.076, ipi: 0.05, cst: '01' },
  { ncm: '4819', descricao: 'Embalagens de papel', pis: 0.0165, cofins: 0.076, ipi: 0.05, cst: '01' },
  { ncm: '6109', descricao: 'T-shirts e camisetas', pis: 0.0165, cofins: 0.076, ipi: 0, cst: '01' },
  { ncm: '7318', descricao: 'Parafusos e ferragens', pis: 0.0165, cofins: 0.076, ipi: 0.1, cst: '01' },
  { ncm: '8471', descricao: 'Computadores', pis: 0.0165, cofins: 0.076, ipi: 0.15, cst: '01' },
  { ncm: '8517', descricao: 'Telefones celulares', pis: 0.0165, cofins: 0.076, ipi: 0.15, cst: '01' },
  { ncm: '8528', descricao: 'Monitores e televisores', pis: 0.0165, cofins: 0.076, ipi: 0.15, cst: '01' },
  { ncm: '9403', descricao: 'Moveis', pis: 0.0165, cofins: 0.076, ipi: 0.05, cst: '01' },
];

/** Aliquota padrao PIS nao-cumulativo (Lucro Real) */
export const ALIQUOTA_PIS_NAO_CUMULATIVO = 0.0165;

/** Aliquota padrao COFINS nao-cumulativo (Lucro Real) */
export const ALIQUOTA_COFINS_NAO_CUMULATIVO = 0.076;

/** Aliquota padrao PIS cumulativo (Lucro Presumido) */
export const ALIQUOTA_PIS_CUMULATIVO = 0.0065;

/** Aliquota padrao COFINS cumulativo (Lucro Presumido) */
export const ALIQUOTA_COFINS_CUMULATIVO = 0.03;
