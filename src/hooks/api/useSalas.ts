
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sala, CreateSalaRequest, StatusSala } from '@/types/api';
import { useAuth } from '../useAuth';
import { useClaims } from '../useClaims';
import { fetchApi } from './baseApi';

// Hook para buscar salas - CORRIGIDO: agora só habilita se pode ler salas
export const useSalas = () => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();
  const { canReadSalas } = useClaims();

  return useQuery({
    queryKey: ['salas', filialSelecionada],
    queryFn: () => fetchApi(`/${filialSelecionada}/Salas`, token) as Promise<Sala[]>,
    enabled: isAuthenticated && canReadSalas(),
  });
};

// Hook para buscar sala por ID
export const useSala = (id: number) => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();
  const { canReadSalas } = useClaims();

  return useQuery({
    queryKey: ['sala', filialSelecionada, id],
    queryFn: () => fetchApi(`/${filialSelecionada}/Salas/${id}`, token) as Promise<Sala>,
    enabled: !!id && isAuthenticated && canReadSalas(),
  });
};

// Hook para criar sala - CORRIGIDO: verifica se pode criar salas
export const useCreateSala = () => {
  const queryClient = useQueryClient();
  const { token, filialSelecionada } = useAuth();
  const { canCreateSalas } = useClaims();

  return useMutation({
    mutationFn: (data: CreateSalaRequest) => {
      if (!canCreateSalas()) {
        throw new Error('Você não tem permissão para criar salas');
      }

      // Converter datas para formato ISO UTC
      const dataInicioISO = new Date(data.dataInicio).toISOString();
      const dataFimISO = new Date(data.dataFim).toISOString();

      // Estrutura exata conforme modelo backend
      const requestData = {
        descricao: data.descricao,
        dataInicio: dataInicioISO,
        dataFim: dataFimISO,
        allDay: data.allDay,
        tipoDeSalaId: data.tipoDeSalaId,
        status: data.status,
        dataCriacao: new Date().toISOString(),
      };

      return fetchApi(`/${filialSelecionada}/Salas`, token, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salas', filialSelecionada] });
    },
    onError: (error: any) => {
      console.error('Erro ao criar sala:', error);

      // Extrair mensagem amigável do erro
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
  const { token, filialSelecionada } = useAuth();
  const { canEditSalas } = useClaims();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSalaData }) => {
      if (!canEditSalas()) {
        throw new Error('Você não tem permissão para editar salas');
      }

      // Estrutura conforme esperado pelo backend
      const requestData = {
        id: data.id,
        empresaId: data.empresaId,
        filialId: data.filialId,
        descricao: data.descricao,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        allDay: data.allDay,
        tipoDeSalaId: data.tipoDeSalaId,
        tipoDeSala: data.tipoDeSala,
        status: data.status,
        dataCriacao: data.dataCriacao,
      };

      return fetchApi(`/${filialSelecionada}/Salas/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify(requestData),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['salas', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['sala', filialSelecionada, id] });
    },
  });
};

// Hook para buscar salas pendentes
export const useSalasPendentes = () => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();
  const { canReadSalas } = useClaims();

  return useQuery({
    queryKey: ['salasPendentes', filialSelecionada],
    queryFn: () => fetchApi(`/${filialSelecionada}/Salas/Pendentes`, token) as Promise<StatusSala[]>,
    enabled: isAuthenticated && canReadSalas(),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
};

// Hook para atualizar status da sala
export const useUpdateSalaStatus = () => {
  const queryClient = useQueryClient();
  const { token, filialSelecionada } = useAuth();
  const { canEditSalas } = useClaims();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => {
      if (!canEditSalas()) {
        throw new Error('Você não tem permissão para alterar o status das salas');
      }

      return fetchApi(`/${filialSelecionada}/Salas/${id}/status`, token, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salas', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['salasPendentes', filialSelecionada] });
    },
  });
};

// Hook para deletar sala - CORRIGIDO: igual ao de eventos
export const useDeleteSala = () => {
  const queryClient = useQueryClient();
  const { token, filialSelecionada } = useAuth();
  const { canDeleteSalas } = useClaims();

  return useMutation({
    mutationFn: (id: number) => {
      if (!canDeleteSalas()) {
        throw new Error('Você não tem permissão para excluir salas');
      }

      return fetchApi(`/${filialSelecionada}/Salas/${id}`, token, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salas', filialSelecionada] });
    },
  });
};
