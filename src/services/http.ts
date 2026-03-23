const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL;

// 🔐 GERENCIAMENTO DO TOKEN
export function getToken(): string | null {
  return localStorage.getItem('authToken');
}

export function saveToken(token: string): void {
  localStorage.setItem('authToken', token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

export function saveRefreshToken(refreshToken: string): void {
  localStorage.setItem('refreshToken', refreshToken);
}

export function saveTokenExpiration(dataExpiracao: string): void {
  localStorage.setItem('tokenExpiration', dataExpiracao);
}

export function getTokenExpiration(): string | null {
  return localStorage.getItem('tokenExpiration');
}

export function saveUserEmail(email: string): void {
  localStorage.setItem('userEmail', email);
}

export function getUserEmail(): string | null {
  return localStorage.getItem('userEmail');
}

export function saveUserName(name: string): void {
  localStorage.setItem('userName', name);
}

export function getUserName(): string | null {
  return localStorage.getItem('userName');
}

export function saveUserEmpresa(empresa: string): void {
  localStorage.setItem('userEmpresa', empresa);
}

export function getUserEmpresa(): string | null {
  return localStorage.getItem('userEmpresa');
}

export function removeToken(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiration');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmpresa');
}

// 📌 FILIAL SELECIONADA
export function getFilialSelecionada(): number {
  const saved = localStorage.getItem('filialSelecionada');
  return saved !== null ? parseInt(saved) : -1;
}

export function saveFilialSelecionada(filialId: number): void {
  localStorage.setItem('filialSelecionada', filialId.toString());
}

export function removeFilialSelecionada(): void {
  localStorage.removeItem('filialSelecionada');
}

/**
 * HTTP genérico para a API principal do sistema.
 * Usa VITE_API_BASE_URL e envia Bearer token automaticamente.
 */
export async function http<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorBody: any;
    try {
      errorBody = await response.json();
    } catch (_e) {
      try {
        errorBody = await response.text();
      } catch (_e2) {
        errorBody = null;
      }
    }
    if (Array.isArray(errorBody)) {
      throw errorBody;
    }
    throw new Error(
      typeof errorBody === 'string'
        ? `Erro HTTP: ${response.status} - ${errorBody}`
        : errorBody?.message || `Erro HTTP: ${response.status}`
    );
  }

  // Tratar respostas vazias
  const contentLength = response.headers.get('content-length');
  const contentType = response.headers.get('content-type');

  if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
    return {} as T;
  }

  try {
    return await response.json();
  } catch {
    return {} as T;
  }
}

/**
 * HTTP para a API de Autenticação (separada).
 * Usa VITE_AUTH_BASE_URL. Não envia Bearer token por padrão (é pública).
 */
export async function httpAuth<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${AUTH_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Erro HTTP: ${response.status}${errorText ? ' - ' + errorText : ''}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

/**
 * Decodificar payload de um JWT com suporte a UTF-8.
 */
export function decodeJwtPayload<T = Record<string, any>>(token: string): T {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

/**
 * Verificar se um token JWT está expirado.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload<{ exp: number }>(token);
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}
