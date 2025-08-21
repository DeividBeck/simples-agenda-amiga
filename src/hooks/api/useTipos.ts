
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TipoEvento, TipoDeSala } from '@/types/api';
import { useAuth } from '../useAuth';
import { useClaims } from '../useClaims';
import { fetchApi } from './baseApi';

// Hook para buscar tipos de eventos
export const useTiposEventos = () => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();
  const { canReadTiposEventos } = useClaims();
  
  return useQuery({
    queryKey: ['tiposEventos', filialSelecionada],
    queryFn: () => fetchApi(`/${filialSelecionada}/TiposEventos`, token) as Promise<TipoEvento[]>,
    enabled: isAuthenticated && canReadTiposEventos(),
  });
};

// Hook para buscar tipos de salas
export const useTiposDeSalas = () => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();
  const { canReadTiposSalas } = useClaims();
  
  return useQuery({
    queryKey: ['tiposDeSalas', filialSelecionada],
    queryFn: () => fetchApi(`/${filialSelecionada}/TiposDeSalas`, token) as Promise<TipoDeSala[]>,
    enabled: isAuthenticated && canReadTiposSalas(),
  });
};

// Hook para criar tipo de evento - CORRIGIDO: verifica se pode criar
export const useCreateTipoEvento = () => {
  const queryClient = useQueryClient();
  const { token, filialSelecionada } = useAuth();
  const { canCreateTiposEventos } = useClaims();
  
  return useMutation({
    mutationFn: (data: Omit<TipoEvento, 'id'>) => {
      if (!canCreateTiposEventos()) {
        throw new Error('Você não tem permissão para criar tipos de eventos');
      }
      return fetchApi(`/${filialSelecionada}/TiposEventos`, token, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposEventos', filialSelecionada] });
    },
  });
};

// Hook para criar tipo de sala - CORRIGIDO: verifica se pode criar
export const useCreateTipoDeSala = () => {
  const queryClient = useQueryClient();
  const { token, filialSelecionada } = useAuth();
  const { canCreateTiposSalas } = useClaims();
  
  return useMutation({
    mutationFn: (data: Omit<TipoDeSala, 'id' | 'dataCriacao' | 'dataAtualizacao'>) => {
      if (!canCreateTiposSalas()) {
        throw new Error('Você não tem permissão para criar tipos de salas');
      }
      return fetchApi(`/${filialSelecionada}/TiposDeSalas`, token, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposDeSalas', filialSelecionada] });
    },
  });
};

// Hook para atualizar tipo de sala
export const useUpdateTipoDeSala = () => {
  const queryClient = useQueryClient();
  const { token, filialSelecionada } = useAuth();
  const { canEditTiposSalas } = useClaims();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TipoDeSala }) => {
      if (!canEditTiposSalas()) {
        throw new Error('Você não tem permissão para editar tipos de salas');
      }
      return fetchApi(`/${filialSelecionada}/TiposDeSalas/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposDeSalas', filialSelecionada] });
    },
  });
};

// Hook para deletar tipo de sala
export const useDeleteTipoDeSala = () => {
  const queryClient = useQueryClient();
  const { token, filialSelecionada } = useAuth();
  const { canDeleteTiposSalas } = useClaims();
  
  return useMutation({
    mutationFn: (id: number) => {
      if (!canDeleteTiposSalas()) {
        throw new Error('Você não tem permissão para excluir tipos de salas');
      }
      return fetchApi(`/${filialSelecionada}/TiposDeSalas/${id}`, token, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposDeSalas', filialSelecionada] });
    },
  });
};
