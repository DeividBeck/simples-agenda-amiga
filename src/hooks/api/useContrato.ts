import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../useAuth';
import { gerarContrato, getContratoPdf } from '@/services/Reservas/reserva.service';

export const useGerarContrato = () => {
    const { filialSelecionada } = useAuth();

    return useMutation({
        mutationFn: (reservaId: number) => gerarContrato(filialSelecionada, reservaId),
    });
};

export const useContratoPdf = (reservaId: number | null) => {
    const { filialSelecionada, isAuthenticated } = useAuth();

    return useQuery({
        queryKey: ['contratoPdf', filialSelecionada, reservaId],
        queryFn: () => getContratoPdf(filialSelecionada, reservaId!),
        enabled: !!reservaId && isAuthenticated,
    });
};