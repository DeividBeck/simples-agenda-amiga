
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../useAuth';
import * as agendaService from '@/services/agenda/agenda.service';
import { TipoEventoGlobal } from '@/services/agenda/agenda.types';

export type { TipoEventoGlobal };

// Hook para buscar tipos de eventos globais (usado quando nível de compartilhamento = Diocese)
export const useTiposEventoGlobal = (enabled: boolean = true) => {
  const { filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['tiposEventoGlobal', filialSelecionada],
    queryFn: () => agendaService.getTiposEventoGlobal(filialSelecionada),
    enabled: isAuthenticated && enabled,
  });
};
