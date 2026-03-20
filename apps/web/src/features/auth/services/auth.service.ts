import { api } from '@/lib/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  cpf: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    isSuperAdmin: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: () => api.post('/auth/logout'),

  getProfile: () => api.get('/auth/profile').then((r) => r.data),
};
