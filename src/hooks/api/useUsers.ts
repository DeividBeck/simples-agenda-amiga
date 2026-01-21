import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCadastroUrl, getChangePasswordUrl } from '@/config/api';
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
      // Invalidar queries relacionadas a usuários se existirem
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