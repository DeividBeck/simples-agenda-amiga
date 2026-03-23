export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  sucesso: boolean;
  token: string;
  refreshToken: string;
  dataExpiracao: string;
  erros: string[];
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  dataExpiracao: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CadastroRequest {
  email: string;
  nome: string;
  empresaId: number;
  claims: { type: string; value: string }[];
  filiais: any[];
}

export interface CadastroResponse {
  sucesso: boolean;
  erros: string[];
}
