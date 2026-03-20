import { AuthService } from './auth.service';

/**
 * Testa a validacao de CPF isolada (logica pura).
 * Os testes de integracao (login, register) requerem MongoDB.
 */
describe('AuthService - CPF Validation', () => {
  // Acessa o metodo privado via cast para testar a logica
  const service = new (AuthService as any)();
  const isValidCpf = (cpf: string) => service.isValidCpf(cpf);

  it('deve aceitar CPF valido: 52998224725', () => {
    expect(isValidCpf('52998224725')).toBe(true);
  });

  it('deve aceitar CPF valido: 11144477735', () => {
    expect(isValidCpf('11144477735')).toBe(true);
  });

  it('deve rejeitar CPF com todos digitos iguais', () => {
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('00000000000')).toBe(false);
    expect(isValidCpf('99999999999')).toBe(false);
  });

  it('deve rejeitar CPF com comprimento errado', () => {
    expect(isValidCpf('1234567890')).toBe(false); // 10 digitos
    expect(isValidCpf('123456789012')).toBe(false); // 12 digitos
  });

  it('deve rejeitar CPF com digito verificador invalido', () => {
    expect(isValidCpf('52998224726')).toBe(false); // Ultimo digito errado
    expect(isValidCpf('52998224715')).toBe(false); // Penultimo digito errado
  });
});
