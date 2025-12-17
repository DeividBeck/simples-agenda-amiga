import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Reserva, ReservaDto } from '@/types/api';
import { useAuth } from '../useAuth';
import { fetchApi } from './baseApi';

// Interface para parcela de pagamento
export interface ParcelaDto {
  id?: number;
  numeroParcela: number;
  valor: number;
  dataVencimento: string;
  isSinal: boolean;
}

// Interface para criar reserva
export interface CreateReservaDto {
  eventoId: number;
  interessadoId: number;
  status?: string;
  valorTotal?: number | null;
  valorSinal?: number | null;
  dataVencimentoSinal?: string | null;
  quantidadeParticipantes?: number | null;
  observacoes?: string | null;
  parcelas?: ParcelaDto[] | null;
}

// Hook para buscar todas as reservas
export const useReservas = () => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['reservas', filialSelecionada],
    queryFn: () => fetchApi(`/${filialSelecionada}/Reservas`, token) as Promise<Reserva[]>,
    enabled: isAuthenticated,
  });
};

// Hook para buscar reserva por ID
export const useReserva = (id: number) => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['reserva', filialSelecionada, id],
    queryFn: () => fetchApi(`/${filialSelecionada}/Reservas/${id}`, token) as Promise<Reserva>,
    enabled: isAuthenticated && !!id,
  });
};

// Hook para criar reserva
export const useCreateReserva = () => {
  const queryClient = useQueryClient();
  const { token, filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: (data: CreateReservaDto) => {
      return fetchApi(`/${filialSelecionada}/Reservas`, token, {
        method: 'POST',
        body: JSON.stringify(data),
      });
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
  const { token, filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReservaDto }) => {
      return fetchApi(`/${filialSelecionada}/Reservas/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas', filialSelecionada] });
    },
  });
};
