
// URL da API baseada no ambiente
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://api.ecclesia.app.br/agendaparoquial/api'  // Produção
  : 'http://localhost:3000/api';  // Desenvolvimento (ajuste conforme sua API local)

// Função para fazer fetch com configuração
export const fetchApi = async (endpoint: string, token?: string, options?: RequestInit) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Adicionar headers do options se existirem
  if (options?.headers) {
    const optionsHeaders = options.headers as Record<string, string>;
    Object.entries(optionsHeaders).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const contentLength = response.headers.get('content-length');
  const contentType = response.headers.get('content-type');

  if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
    return {};
  }

  try {
    return await response.json();
  } catch (error) {
    return {};
  }
};
