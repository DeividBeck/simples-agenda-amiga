import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Interessado } from '@/types/api';
import { useAuth } from '../useAuth';
import { fetchApi } from './baseApi';

// Hook para buscar contratantes
export const useInteressados = () => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['interessados', filialSelecionada],
    queryFn: () => fetchApi(`/${filialSelecionada}/Interessados`, token) as Promise<Interessado[]>,
    enabled: isAuthenticated,
  });
};

// Hook para buscar contratante por ID
export const useInteressado = (id: number) => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['interessado', filialSelecionada, id],
    queryFn: () => fetchApi(`/${filialSelecionada}/Interessados/${id}`, token) as Promise<Interessado>,
    enabled: isAuthenticated && !!id,
  });
};

// Hook para criar contratante
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

// Hook para atualizar contratante
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

// Hook para deletar contratante
export const useDeleteInteressado = () => {
  const queryClient = useQueryClient();
  const { token, filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: (id: number) => {
      return fetchApi(`/${filialSelecionada}/Interessados/${id}`, token, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interessados', filialSelecionada] });
    },
  });
};
