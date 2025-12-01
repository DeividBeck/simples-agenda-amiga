
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Evento, CreateEventoRequest, ENivelCompartilhamento } from '@/types/api';
import { useAuth } from '../useAuth';
import { useClaims } from '../useClaims';
import { fetchApi } from './baseApi';

// Hook para buscar eventos com filtro por nível de compartilhamento
export const useEventos = (nivelCompartilhamento?: ENivelCompartilhamento, enabled: boolean = true) => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();
  const queryParams = nivelCompartilhamento !== undefined ? `?nivelCompartilhamento=${nivelCompartilhamento}` : '';

  return useQuery({
    queryKey: ['eventos', filialSelecionada, nivelCompartilhamento],
    queryFn: () => fetchApi(`/${filialSelecionada}/Eventos${queryParams}`, token) as Promise<Evento[]>,
    enabled: isAuthenticated && enabled,
  });
};

// Hook para buscar eventos públicos
export const useEventosPublicos = () => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['eventosPublicos', filialSelecionada],
    queryFn: () => fetchApi(`/${filialSelecionada}/Eventos/Publicos`, token) as Promise<Evento[]>,
    enabled: isAuthenticated,
  });
};

// Hook para buscar eventos da diocese
export const useEventosDiocese = (dioceseId: number) => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['eventosDiocese', filialSelecionada, dioceseId],
    queryFn: () => fetchApi(`/${filialSelecionada}/Eventos/Diocese/${dioceseId}`, token) as Promise<Evento[]>,
    enabled: !!dioceseId && isAuthenticated,
  });
};

// Hook para buscar eventos da paróquia
export const useEventosParoquia = (dioceseId: number, paroquiaId: number) => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['eventosParoquia', filialSelecionada, dioceseId, paroquiaId],
    queryFn: () => fetchApi(`/${filialSelecionada}/Eventos/Paroquia/${dioceseId}/${paroquiaId}`, token) as Promise<Evento[]>,
    enabled: !!dioceseId && !!paroquiaId && isAuthenticated,
  });
};

// Hook para buscar evento por ID
export const useEvento = (id: number) => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['evento', filialSelecionada, id],
    queryFn: () => fetchApi(`/${filialSelecionada}/Eventos/${id}`, token) as Promise<Evento>,
    enabled: !!id && isAuthenticated,
  });
};

// Hook para buscar evento por slug - ATUALIZADO
export const useEventoBySlug = (slug: string) => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['evento', 'slug', filialSelecionada, slug],
    queryFn: () => fetchApi(`/${filialSelecionada}/Eventos/Slug/${slug}`, token) as Promise<Evento>,
    enabled: !!slug && isAuthenticated,
  });
};

// Novo hook para buscar evento público por slug
export const useEventoBySlugPublico = (filial: number, slug: string) => {
  return useQuery({
    queryKey: ['evento', 'publico', 'slug', filial, slug],
    queryFn: () => fetchApi(`/${filial}/Eventos/publico/${slug}`) as Promise<Evento>,
    enabled: !!filial && !!slug,
  });
};

// Hook para criar evento
export const useCreateEvento = () => {
  const queryClient = useQueryClient();
  const { token, filialSelecionada } = useAuth();
  const { canCreateEventos } = useClaims();

  return useMutation({
    mutationFn: (data: CreateEventoRequest) => {
      if (!canCreateEventos()) {
        throw new Error('Você não tem permissão para criar eventos');
      }

      // Converter datas para formato ISO UTC se necessário
      const dataInicioISO = data.dataInicio.includes('T') ?
        new Date(data.dataInicio).toISOString() :
        new Date(data.dataInicio + 'T00:00:00').toISOString();

      const dataFimISO = data.dataFim.includes('T') ?
        new Date(data.dataFim).toISOString() :
        new Date(data.dataFim + 'T23:59:59').toISOString();

      // Estrutura dos dados conforme esperado pelo backend
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
        novaSala: data.novaSala || null
      };

      return fetchApi(`/${filialSelecionada}/Eventos`, token, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['eventosPublicos', filialSelecionada] });
    },
    onError: (error: any) => {
      console.error('Erro ao criar evento:', error);

      // Extrair mensagem amigável do erro
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

// Interface para dados de atualização de evento (conforme formato que funciona no Postman)
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
  const { token, filialSelecionada } = useAuth();

  return useMutation({
    mutationFn: ({ id, data, scope }: { id: number; data: Omit<UpdateEventoData, 'id'>; scope?: number }) => {

      // Converter datas para formato ISO UTC se necessário
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
      } as UpdateEventoData;
      const queryParam = scope !== undefined ? `?scope=${scope}` : '';
      return fetchApi(`/${filialSelecionada}/Eventos/${id}${queryParam}`, token, {
        method: 'PUT',
        body: JSON.stringify(requestData),
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['eventos', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['evento', filialSelecionada, id] });
      queryClient.invalidateQueries({ queryKey: ['eventosPublicos', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['salas', filialSelecionada] });
    },
    onError: (error) => {
      console.error('5. Erro capturado no onError (atualização):', error);
    },
  });
};

// Hook para deletar evento
export const useDeleteEvento = () => {
  const queryClient = useQueryClient();
  const { token, filialSelecionada } = useAuth();
  const { canDeleteEventos } = useClaims();

  return useMutation({
    mutationFn: ({ id, scope }: { id: number; scope?: number }) => {
      if (!canDeleteEventos()) {
        throw new Error('Você não tem permissão para excluir eventos');
      }

      const queryParam = scope !== undefined ? `?scope=${scope}` : '';
      return fetchApi(`/${filialSelecionada}/Eventos/${id}${queryParam}`, token, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['eventosPublicos', filialSelecionada] });
      queryClient.invalidateQueries({ queryKey: ['salas', filialSelecionada] });
    },
  });
};
