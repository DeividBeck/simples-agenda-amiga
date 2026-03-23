import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Interessado } from '@/types/api';
import { useAuth } from '../useAuth';
import * as agendaService from '@/services/agenda/agenda.service';

// Hook para buscar contratantes
export const useInteressados = () => {
  const { filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['interessados', filialSelecionada],
    queryFn: () => agendaService.getInteressados(filialSelecionada),
    enabled: isAuthenticated,
  });
};

// Hook para buscar contratante por ID
export const useInteressado = (id: number) => {
  const { filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['interessado', filialSelecionada, id],
    queryFn: () => agendaService.getInteressado(filialSelecionada, id),
    enabled: isAuthenticated && !!id,
  });
};

// Hook para criar contratante
export const useCreateInteressado = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: (data: Omit<Interessado, 'id'>) => {
      return agendaService.createInteressado(filialSelecionada, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interessados', filialSelecionada] });
    },
  });
};

// Hook para atualizar contratante
export const useUpdateInteressado = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Interessado }) => {
      return agendaService.updateInteressado(filialSelecionada, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interessados', filialSelecionada] });
    },
  });
};

// Hook para deletar contratante
export const useDeleteInteressado = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: (id: number) => {
      return agendaService.deleteInteressado(filialSelecionada, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interessados', filialSelecionada] });
    },
  });
};
