
import { useQuery } from '@tanstack/react-query';
import { FichaInscricao } from '@/types/api';
import { useAuth } from '../useAuth';
import { fetchApi } from './baseApi';

// Hook para buscar inscrições de um evento
export const useInscricoesEvento = (eventoId: number) => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['inscricoes', filialSelecionada, eventoId],
    queryFn: () => fetchApi(`/${filialSelecionada}/FichaInscricaoBatismos/Evento/${eventoId}`, token) as Promise<FichaInscricao[]>,
    enabled: !!eventoId && isAuthenticated,
  });
};
