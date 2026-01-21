import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCadastroUrl, getChangePasswordUrl, getListarUsuariosUrl, getAtualizarUsuarioUrl } from '@/config/api';
import { useAuth } from '@/hooks/useAuth';

interface CadastroForm {
  email: string;
  nome: string;
  claims: string[];
}

export interface ChangePasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface Acesso {
  modulo: string;
  acesso: string;
}

export interface Usuario {
  email: string;
  nome: string;
  acessos: Acesso[];
}

export interface UpdateUsuarioForm {
  email: string;
  nome: string;
  acessos: Acesso[];
}

export const useCadastroUsuario = () => {
  const { token, tokenData } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CadastroForm) => {
      if (!token || !tokenData) {
        throw new Error('Token não encontrado');
      }

      const usuarioData = {
        email: data.email,
        nome: data.nome,
        empresaId: parseInt(tokenData.EmpresaId),
        claims: data.claims.map(claim => ({
          type: 'Calendario',
          value: claim
        })),
        filiais: []
      };

      const response = await fetch(getCadastroUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(usuarioData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Debug - Error response:', errorText);
        throw new Error(`Erro no cadastro: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

export const useChangePassword = () => {
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(getChangePasswordUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao alterar senha: ${response.status} - ${errorText}`);
      }

      return response.ok;
    },
  });
};

export const useListarUsuarios = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async (): Promise<Usuario[]> => {
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(getListarUsuariosUrl(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao listar usuários: ${response.status} - ${errorText}`);
      }

      return response.json();
    },
    enabled: !!token,
  });
};

export const useAtualizarUsuario = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUsuarioForm) => {
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(getAtualizarUsuarioUrl(data.email), {
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

      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};