
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sala, CreateSalaRequest, StatusSala } from '@/types/api';
import { useAuth } from '../useAuth';
import { useClaims } from '../useClaims';
import * as agendaService from '@/services/agenda/agenda.service';

// Hook para buscar salas
export const useSalas = () => {
  const { filialSelecionada, isAuthenticated } = useAuth();
  const { canReadSalas } = useClaims();

  return useQuery({
    queryKey: ['salas', filialSelecionada],
    queryFn: () => agendaService.getSalas(filialSelecionada),
    enabled: isAuthenticated && canReadSalas(),
  });
};

// Hook para buscar sala por ID
export const useSala = (id: number) => {
  const { filialSelecionada, isAuthenticated } = useAuth();
  const { canReadSalas } = useClaims();

  return useQuery({
    queryKey: ['sala', filialSelecionada, id],
    queryFn: () => agendaService.getSala(filialSelecionada, id),
    enabled: !!id && isAuthenticated && canReadSalas(),
  });
};

// Hook para criar sala
export const useCreateSala = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: (data: CreateSalaRequest) => {
      const dataInicioISO = new Date(data.dataInicio).toISOString();
      const dataFimISO = new Date(data.dataFim).toISOString();

      const requestData = {
        descricao: data.descricao,
        dataInicio: dataInicioISO,
        dataFim: dataFimISO,
        allDay: data.allDay,
        tipoDeSalaId: data.tipoDeSalaId,
        status: data.status,
        dataCriacao: new Date().toISOString(),
      };

      return agendaService.createSala(filialSelecionada, requestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salas', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['salasPendentes', filialSelecionada] });
    },
    onError: (error: any) => {
      console.error('Erro ao criar sala:', error);
      let errorMessage = 'Erro ao criar sala';
      if (error.message && error.message.includes('API Error:')) {
        try {
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[0]);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (e) {
          errorMessage = error.message.replace(/API Error: \d+ - /, '');
        }
      }
      throw new Error(errorMessage);
    },
  });
};

// Interface para dados de atualização de sala
interface UpdateSalaData {
  id: number;
  empresaId: number;
  filialId: number;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  allDay: boolean;
  tipoDeSalaId: number;
  tipoDeSala: any | null;
  status: number;
  dataCriacao: string;
}

// Hook para atualizar sala
export const useUpdateSala = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSalaData }) => {
      return agendaService.updateSala(filialSelecionada, id, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['salas', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['sala', filialSelecionada, id] });
    },
  });
};

// Hook para buscar salas pendentes
export const useSalasPendentes = () => {
  const { filialSelecionada, isAuthenticated } = useAuth();
  const { canReadSalas } = useClaims();

  return useQuery({
    queryKey: ['salasPendentes', filialSelecionada],
    queryFn: () => agendaService.getSalasPendentes(filialSelecionada),
    enabled: isAuthenticated && canReadSalas(),
    refetchInterval: 30000,
  });
};

// Hook para atualizar status da sala
export const useUpdateSalaStatus = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => {
      return agendaService.updateSalaStatus(filialSelecionada, id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salas', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['salasPendentes', filialSelecionada] });
    },
  });
};

// Hook para deletar sala
export const useDeleteSala = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: (id: number) => {
      return agendaService.deleteSala(filialSelecionada, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salas', filialSelecionada] });
    },
  });
};
