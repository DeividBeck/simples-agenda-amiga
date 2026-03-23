
import { useQuery } from '@tanstack/react-query';
import { FichaInscricao } from '@/types/api';
import { useAuth } from '../useAuth';
import * as agendaService from '@/services/agenda/agenda.service';

// Hook para buscar inscrições de um evento
export const useInscricoesEvento = (eventoId: number) => {
  const { filialSelecionada, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['inscricoes', filialSelecionada, eventoId],
    queryFn: () => agendaService.getInscricoesEvento(filialSelecionada, eventoId),
    enabled: !!eventoId && isAuthenticated,
  });
};
