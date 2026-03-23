import { httpAuth, getToken } from '../http';
import {
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ChangePasswordRequest,
  CadastroRequest,
  CadastroResponse,
} from './autenticacao.types';

/**
 * POST /api/Autenticacao/LogIn
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return httpAuth<LoginResponse>('/api/Autenticacao/LogIn', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * POST /api/Autenticacao/ForgotPassword
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<void> {
  await httpAuth<void>('/api/Autenticacao/ForgotPassword', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * POST /api/Autenticacao/refresh-token
 */
export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  return httpAuth<RefreshTokenResponse>('/api/Autenticacao/refresh-token', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * POST /api/Autenticacao/ChangePassword
 */
export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  const token = getToken();
  await httpAuth<void>('/api/Autenticacao/ChangePassword', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}

/**
 * POST /api/Autenticacao/Cadastro
 */
export async function cadastrarUsuario(data: CadastroRequest): Promise<CadastroResponse> {
  const token = getToken();
  return httpAuth<CadastroResponse>('/api/Autenticacao/Cadastro', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}
