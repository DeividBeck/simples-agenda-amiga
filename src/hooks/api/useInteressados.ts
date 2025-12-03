import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Interessado } from '@/types/api';
import { useAuth } from '../useAuth';
import { fetchApi } from './baseApi';

// Hook para buscar interessados
export const useInteressados = () => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['interessados', filialSelecionada],
    queryFn: () => fetchApi(`/${filialSelecionada}/Interessados`, token) as Promise<Interessado[]>,
    enabled: isAuthenticated,
  });
};

// Hook para buscar interessado por ID
export const useInteressado = (id: number) => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['interessado', filialSelecionada, id],
    queryFn: () => fetchApi(`/${filialSelecionada}/Interessados/${id}`, token) as Promise<Interessado>,
    enabled: isAuthenticated && !!id,
  });
};

// Hook para criar interessado
export const useCreateInteressado = () => {
  const queryClient = useQueryClient();
  const { token, filialSelecionada } = useAuth();
  
  return useMutation({
    mutationFn: (data: Omit<Interessado, 'id'>) => {
      return fetchApi(`/${filialSelecionada}/Interessados`, token, {
        method: 'POST',
        body: JSON.stringify(data),
      }) as Promise<Interessado>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interessados', filialSelecionada] });
    },
  });
};

// Hook para atualizar interessado
export const useUpdateInteressado = () => {
  const queryClient = useQueryClient();
  const { token, filialSelecionada } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Interessado }) => {
      return fetchApi(`/${filialSelecionada}/Interessados/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interessados', filialSelecionada] });
    },
  });
};
