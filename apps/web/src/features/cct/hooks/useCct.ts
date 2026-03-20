import { useMutation } from '@tanstack/react-query';
import { cctService } from '../services/cct.service';

export function useCompareRegimes() {
  return useMutation({
    mutationFn: (data: { receitaAnual: number; despesasAnuais: number }) =>
      cctService.compareRegimes(data),
  });
}

export function useSimplesRates() {
  return useMutation({
    mutationFn: (data: { cnae: string; receita12m: number }) =>
      cctService.getSimplesRates(data),
  });
}

export function usePisCofins() {
  return useMutation({
    mutationFn: (data: { ncm: string }) =>
      cctService.getPisCofins(data),
  });
}
