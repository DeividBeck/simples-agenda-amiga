import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import * as autenticacaoService from '@/services/autenticacao/autenticacao.service';
import { ChangePasswordRequest } from '@/services/autenticacao/autenticacao.types';

export type { ChangePasswordRequest as ChangePasswordForm };

interface CadastroForm {
  email: string;
  nome: string;
  claims: string[];
}

export const useCadastroUsuario = () => {
  const { tokenData } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CadastroForm) => {
      if (!tokenData) {
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

      return autenticacaoService.cadastrarUsuario(usuarioData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      await autenticacaoService.changePassword(data);
      return true;
    },
  });
};
