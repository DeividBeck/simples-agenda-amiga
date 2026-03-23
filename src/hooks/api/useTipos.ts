
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TipoEvento, TipoDeSala } from '@/types/api';
import { useAuth } from '../useAuth';
import { useClaims } from '../useClaims';
import * as agendaService from '@/services/agenda/agenda.service';

// Hook para buscar tipos de eventos
export const useTiposEventos = () => {
  const { filialSelecionada, isAuthenticated } = useAuth();
  const { canReadTiposEventos } = useClaims();

  return useQuery({
    queryKey: ['tiposEventos', filialSelecionada],
    queryFn: () => agendaService.getTiposEventos(filialSelecionada),
    enabled: isAuthenticated && canReadTiposEventos(),
  });
};

// Hook para buscar tipos de salas
export const useTiposDeSalas = () => {
  const { filialSelecionada, isAuthenticated } = useAuth();
  const { canReadTiposSalas } = useClaims();

  return useQuery({
    queryKey: ['tiposDeSalas', filialSelecionada],
    queryFn: () => agendaService.getTiposDeSalas(filialSelecionada),
    enabled: isAuthenticated && canReadTiposSalas(),
  });
};

// Hook para criar tipo de evento
export const useCreateTipoEvento = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: (data: Omit<TipoEvento, 'id'>) => {
      return agendaService.createTipoEvento(filialSelecionada, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposEventos', filialSelecionada] });
    },
  });
};

// Hook para criar tipo de sala
export const useCreateTipoDeSala = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: (data: Omit<TipoDeSala, 'id' | 'dataCriacao' | 'dataAtualizacao'>) => {
      return agendaService.createTipoDeSala(filialSelecionada, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposDeSalas', filialSelecionada] });
    },
  });
};

// Hook para atualizar tipo de evento
export const useUpdateTipoEvento = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TipoEvento }) => {
      return agendaService.updateTipoEvento(filialSelecionada, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposEventos', filialSelecionada] });
    },
  });
};

// Hook para deletar tipo de evento
export const useDeleteTipoEvento = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: (id: number) => {
      return agendaService.deleteTipoEvento(filialSelecionada, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposEventos', filialSelecionada] });
    },
  });
};

export const useUpdateTipoDeSala = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TipoDeSala }) => {
      return agendaService.updateTipoDeSala(filialSelecionada, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposDeSalas', filialSelecionada] });
    },
  });
};

// Hook para deletar tipo de sala
export const useDeleteTipoDeSala = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: (id: number) => {
      return agendaService.deleteTipoDeSala(filialSelecionada, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposDeSalas', filialSelecionada] });
    },
  });
};
