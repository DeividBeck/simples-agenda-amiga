
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../useAuth';
import * as agendaService from '@/services/agenda/agenda.service';
import { FilialData } from '@/services/agenda/agenda.types';

export type { FilialData };

export const useFilialData = () => {
  const { token, filialSelecionada } = useAuth();

  return useQuery<FilialData>({
    queryKey: ['filial-data', filialSelecionada],
    queryFn: () => agendaService.getFilialData(filialSelecionada),
    enabled: !!token && filialSelecionada !== undefined,
  });
};

export const useUpdateFilial = () => {
  const { filialSelecionada } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FilialData) =>
      agendaService.updateFilialData(filialSelecionada, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filial-data', filialSelecionada] });
    },
  });
};
