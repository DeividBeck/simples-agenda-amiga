import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export interface UsuarioAcesso {
  modulo: string;
  acesso: string;
}

export interface Usuario {
  email: string;
  nome: string;
  acessos: UsuarioAcesso[];
}

export interface UpdateUsuarioRequest {
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

const getUpdateUsuarioUrl = (email: string) => {
  const isProduction = import.meta.env.PROD;
  const baseUrl = isProduction
    ? 'https://api.ecclesia.app.br/autenticacao/api/Usuarios/AtualizarUsuario'
    : 'https://localhost:7208/api/Usuarios/AtualizarUsuario';
  return `${baseUrl}/${encodeURIComponent(email)}`;
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

export const useUpdateUsuario = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUsuarioRequest) => {
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(getUpdateUsuarioUrl(data.email), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao atualizar usuário: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};
