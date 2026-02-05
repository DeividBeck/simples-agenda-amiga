
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../useAuth';
import { fetchApi } from './baseApi';

export interface TipoEventoGlobal {
  id: number;
  empresaId: number;
  nome: string;
  cor: string;
  disponivel: boolean;
  empresa: {
    id: number;
    name: string;
    cnpj: string;
  } | null;
}

// Hook para buscar tipos de eventos globais (usado quando nível de compartilhamento = Diocese)
export const useTiposEventoGlobal = (enabled: boolean = true) => {
  const { token, filialSelecionada, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['tiposEventoGlobal', filialSelecionada],
    queryFn: () => fetchApi(`/${filialSelecionada}/TiposEventoGlobal`, token) as Promise<TipoEventoGlobal[]>,
    enabled: isAuthenticated && enabled,
  });
};
