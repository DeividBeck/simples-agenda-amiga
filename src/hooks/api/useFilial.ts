
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../useAuth';
import { fetchApi } from './baseApi';

export interface FilialData {
  id: number;
  nome: string;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  representanteLegal: string | null;
  rgRepresentante: string | null;
  cpfRepresentante: string | null;
  banco: string | null;
  agencia: string | null;
  contaCorrente: string | null;
  chavePix: string | null;
}

export const useFilialData = () => {
  const { token, filialSelecionada } = useAuth();

  return useQuery<FilialData>({
    queryKey: ['filial-data', filialSelecionada],
    queryFn: () => fetchApi(`/${filialSelecionada}/Filial`, token!),
    enabled: !!token && filialSelecionada !== undefined,
  });
};

export const useUpdateFilial = () => {
  const { token, filialSelecionada } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FilialData) =>
      fetchApi(`/${filialSelecionada}/Filial`, token!, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filial-data', filialSelecionada] });
    },
  });
};
