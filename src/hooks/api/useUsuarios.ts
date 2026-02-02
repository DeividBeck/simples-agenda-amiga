import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { API_CONFIG } from '@/config/api';

export interface UsuarioAcesso {
  modulo: string;
  acesso: string;
}

export interface Usuario {
  email: string;
  nome: string;
  acessos: UsuarioAcesso[];
}

const getUsuariosUrl = () => {
  const isProduction = import.meta.env.PROD;
  return isProduction
    ? 'https://api.ecclesia.app.br/autenticacao/api/Usuarios/ListarUsuarios'
    : 'https://localhost:7208/api/Usuarios/ListarUsuarios';
};

export const useUsuarios = () => {
  const { token } = useAuth();

  return useQuery<Usuario[]>({
    queryKey: ['usuarios'],
    queryFn: async () => {
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(getUsuariosUrl(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar usuários: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!token,
  });
};
