
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Evento, CreateEventoRequest, ENivelCompartilhamento } from '@/types/api';
import { useAuth } from '../useAuth';
import { useClaims } from '../useClaims';
import * as agendaService from '@/services/agenda/agenda.service';

// Hook para buscar eventos com filtro por níveis de compartilhamento (suporta array)
export const useEventos = (niveis?: ENivelCompartilhamento[], enabled: boolean = true) => {
  const { filialSelecionada, isAuthenticated } = useAuth();
  
  const queryParams = niveis && niveis.length > 0 
    ? `?${niveis.map(n => `niveis=${ENivelCompartilhamento[n]}`).join('&')}`
    : '';

  return useQuery({
    queryKey: ['eventos', filialSelecionada, niveis],
    queryFn: () => agendaService.getEventos(filialSelecionada, queryParams),
    enabled: isAuthenticated && enabled,
  });
};

// Hook para buscar eventos públicos
export const useEventosPublicos = () => {
  const { filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['eventosPublicos', filialSelecionada],
    queryFn: () => agendaService.getEventosPublicos(filialSelecionada),
    enabled: isAuthenticated,
  });
};

// Hook para buscar eventos da diocese
export const useEventosDiocese = (dioceseId: number) => {
  const { filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['eventosDiocese', filialSelecionada, dioceseId],
    queryFn: () => agendaService.getEventosDiocese(filialSelecionada, dioceseId),
    enabled: !!dioceseId && isAuthenticated,
  });
};

// Hook para buscar eventos da paróquia
export const useEventosParoquia = (dioceseId: number, paroquiaId: number) => {
  const { filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['eventosParoquia', filialSelecionada, dioceseId, paroquiaId],
    queryFn: () => agendaService.getEventosParoquia(filialSelecionada, dioceseId, paroquiaId),
    enabled: !!dioceseId && !!paroquiaId && isAuthenticated,
  });
};

// Hook para buscar evento por ID
export const useEvento = (id: number) => {
  const { filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['evento', filialSelecionada, id],
    queryFn: () => agendaService.getEvento(filialSelecionada, id),
    enabled: !!id && isAuthenticated,
  });
};

// Hook para buscar evento por slug
export const useEventoBySlug = (slug: string) => {
  const { filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['evento', 'slug', filialSelecionada, slug],
    queryFn: () => agendaService.getEventoBySlug(filialSelecionada, slug),
    enabled: !!slug && isAuthenticated,
  });
};

// Hook para buscar evento público por slug
export const useEventoBySlugPublico = (filial: number, slug: string) => {
  return useQuery({
    queryKey: ['evento', 'publico', 'slug', filial, slug],
    queryFn: () => agendaService.getEventoBySlugPublico(filial, slug),
    enabled: !!filial && !!slug,
  });
};

// Hook para criar evento
export const useCreateEvento = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();
  const { canCreateEventos } = useClaims();

  return useMutation({
    mutationFn: (data: CreateEventoRequest) => {
      if (!canCreateEventos()) {
        throw new Error('Você não tem permissão para criar eventos');
      }

      const dataInicioISO = data.dataInicio.includes('T') ?
        new Date(data.dataInicio).toISOString() :
        new Date(data.dataInicio + 'T00:00:00').toISOString();

      const dataFimISO = data.dataFim.includes('T') ?
        new Date(data.dataFim).toISOString() :
        new Date(data.dataFim + 'T23:59:59').toISOString();

      const requestData = {
        titulo: data.titulo,
        descricao: data.descricao,
        dataInicio: dataInicioISO,
        dataFim: dataFimISO,
        allDay: data.allDay,
        tipoEventoId: data.tipoEventoId,
        inscricaoAtiva: data.inscricaoAtiva,
        nomeFormulario: data.nomeFormulario,
        nivelCompartilhamento: data.nivelCompartilhamento,
        recorrencia: data.recorrencia || 0,
        fimRecorrencia: data.fimRecorrencia || null,
        novaSala: data.novaSala || null,
        interessadoId: data.interessadoId || null,
        reserva: data.reserva || null,
      };

      return agendaService.createEvento(filialSelecionada, requestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['eventosPublicos', filialSelecionada] });
    },
    onError: (error: any) => {
      console.error('Erro ao criar evento:', error);
      let errorMessage = 'Erro ao criar evento';
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

// Interface para dados de atualização de evento
interface UpdateEventoData {
  id: number;
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  allDay: boolean;
  tipoEventoId: number;
  inscricaoAtiva: boolean;
  nomeFormulario?: number | null;
  slug?: string | null;
  nivelCompartilhamento: number;
  recorrencia?: number;
  fimRecorrencia?: string | null;
  eventoPaiId?: number | null;
  filialId?: number;
  tipoEvento?: any;
  sala?: any;
  novaSala?: {
    descricao: string;
    tipoDeSalaId: number;
    dataInicio: string;
    dataFim: string;
    allDay: boolean;
  } | null;
  [key: string]: any;
}

export const useUpdateEvento = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: ({ id, data, scope }: { id: number; data: Omit<UpdateEventoData, 'id'>; scope?: number }) => {
      const dataInicioISO = data.dataInicio.includes('T') ?
        new Date(data.dataInicio).toISOString() :
        new Date(data.dataInicio + 'T00:00:00').toISOString();

      const dataFimISO = data.dataFim.includes('T') ?
        new Date(data.dataFim).toISOString() :
        new Date(data.dataFim + 'T23:59:59').toISOString();

      const requestData = {
        ...(data as UpdateEventoData),
        id,
        dataInicio: dataInicioISO,
        dataFim: dataFimISO,
      };

      return agendaService.updateEvento(filialSelecionada, id, requestData, scope);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['eventos', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['evento', filialSelecionada, id] });
      queryClient.invalidateQueries({ queryKey: ['eventosPublicos', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['salas', filialSelecionada] });
    },
    onError: (error) => {
      console.error('Erro na atualização:', error);
    },
  });
};

// Hook para deletar evento
export const useDeleteEvento = () => {
  const queryClient = useQueryClient();
  const { filialSelecionada } = useAuth();
  const { canDeleteEventos } = useClaims();

  return useMutation({
    mutationFn: ({ id, scope }: { id: number; scope?: number }) => {
      if (!canDeleteEventos()) {
        throw new Error('Você não tem permissão para excluir eventos');
      }
      return agendaService.deleteEvento(filialSelecionada, id, scope);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['eventosPublicos', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['salas', filialSelecionada] });
    },
  });
};
