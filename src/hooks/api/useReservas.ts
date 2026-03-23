import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Reserva, ReservaDto } from '@/types/api';
import { useAuth } from '../useAuth';
import * as agendaService from '@/services/agenda/agenda.service';
import { CreateReservaDto, ParcelaDto } from '@/services/agenda/agenda.types';

export type { CreateReservaDto, ParcelaDto };

// Hook para buscar todas as reservas
export const useReservas = () => {
  const { filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['reservas', filialSelecionada],
    queryFn: () => agendaService.getReservas(filialSelecionada),
    enabled: isAuthenticated,
  });
};

// Hook para buscar reserva por ID
export const useReserva = (id: number) => {
  const { filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['reserva', filialSelecionada, id],
    queryFn: () => agendaService.getReserva(filialSelecionada, id),
    enabled: isAuthenticated && !!id,
  });
};

// Hook para criar reserva
export const useCreateReserva = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: (data: CreateReservaDto) => {
      return agendaService.createReserva(filialSelecionada, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['eventos', filialSelecionada] });
    },
  });
};

// Hook para atualizar reserva (dados do contrato pelo Admin)
export const useUpdateReserva = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReservaDto }) => {
      return agendaService.updateReserva(filialSelecionada, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas', filialSelecionada] });
    },
  });
};
