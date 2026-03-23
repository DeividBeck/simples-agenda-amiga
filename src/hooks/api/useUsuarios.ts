import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import * as usuariosService from '@/services/usuarios/usuarios.service';
import { Usuario, UpdateUsuarioRequest, UsuarioAcesso } from '@/services/usuarios/usuarios.types';

export type { Usuario, UpdateUsuarioRequest, UsuarioAcesso };

export const useUsuarios = () => {
  const { token } = useAuth();

  return useQuery<Usuario[]>({
    queryKey: ['usuarios'],
    queryFn: () => usuariosService.listarUsuarios(),
    enabled: !!token,
  });
};

export const useUpdateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUsuarioRequest) => {
      return usuariosService.atualizarUsuario(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};
