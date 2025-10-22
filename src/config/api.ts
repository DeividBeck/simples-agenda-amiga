// Configuração centralizada das APIs baseada no ambiente

const isProduction = import.meta.env.PROD;

// URLs base das APIs
export const API_CONFIG = {
  // API principal (agenda paroquial)
  BASE_URL: isProduction
    ? 'https://api.ecclesia.app.br/agendaparoquial/api'
    : 'https://localhost:7096/api',
  
  // API de autenticação  
  AUTH_URL: isProduction
    ? 'https://api.ecclesia.app.br/autenticacao/api/Autenticacao/LogIn'
    : 'https://localhost:7208/api/Autenticacao/LogIn',

  // API de cadastro
  CADASTRO_URL: isProduction
    ? 'https://api.ecclesia.app.br/autenticacao/api/Autenticacao/Cadastro'
    : 'https://localhost:7208/api/Autenticacao/Cadastro',

  // API de mudança de senha
  CHANGE_PASSWORD_URL: isProduction
    ? 'https://api.ecclesia.app.br/autenticacao/api/Autenticacao/ChangePassword'
    : 'https://localhost:7208/api/Autenticacao/ChangePassword',
};

// Função helper para detectar ambiente
export const isDevelopment = () => !isProduction;
export const isProductionEnv = () => isProduction;

// Função para obter URL completa da API principal
export const getApiUrl = (endpoint: string) => `${API_CONFIG.BASE_URL}${endpoint}`;

// Função para obter URL de autenticação
export const getAuthUrl = () => API_CONFIG.AUTH_URL;

// Função para obter URL de cadastro
export const getCadastroUrl = () => API_CONFIG.CADASTRO_URL;

// Função para obter URL de mudança de senha
export const getChangePasswordUrl = () => API_CONFIG.CHANGE_PASSWORD_URL;