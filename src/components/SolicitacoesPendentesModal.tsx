import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSalasPendentes, useUpdateSalaStatus } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EStatusReserva } from '@/types/api';
import { useClaims } from '@/hooks/useClaims';

interface SolicitacoesPendentesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SolicitacoesPendentesModal = ({ isOpen, onClose }: SolicitacoesPendentesModalProps) => {
    const { data: salasPendentes, isLoading } = useSalasPendentes();
    const updateStatus = useUpdateSalaStatus();
    const { toast } = useToast();
    const { canApproveSalas } = useClaims();

    const handleUpdateStatus = async (id: number, status: EStatusReserva, descricao: string) => {
        try {
            await updateStatus.mutateAsync({ id, status });

            const statusText = status === EStatusReserva.Aprovado ? 'aprovada' : 'rejeitada';
            toast({
                title: 'Status atualizado',
                description: `Solicitação "${descricao}" foi ${statusText} com sucesso.`,
            });
        } catch (error: any) {
            toast({
                title: 'Erro ao atualizar status',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const formatDataHora = (dataInicio: string, dataFim: string) => {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);

        return {
            data: format(inicio, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
            horaInicio: format(inicio, 'HH:mm', { locale: ptBR }),
            horaFim: format(fim, 'HH:mm', { locale: ptBR }),
        };
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        Solicitações Pendentes
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground">Carregando solicitações...</div>
                    </div>
                ) : !salasPendentes || salasPendentes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Check className="h-12 w-12 text-green-500 mb-2" />
                        <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {salasPendentes.map((sala) => {
                            const { data, horaInicio, horaFim } = formatDataHora(sala.dataInicio, sala.dataFim);

                            return (
                                <div
                                    key={sala.id}
                                    className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="secondary" className="bg-primary/10">
                                                    Pendente
                                                </Badge>
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-semibold text-base">
                                                        {sala.nomeTipoDeSala || 'Sala não especificada'}
                                                    </span>
                                                </div>
                                            </div>

                                            {sala.descricao && (
                                                <div className="pl-5">
                                                    <p className="text-sm text-muted-foreground">
                                                        <span className="font-medium">Descrição:</span> {sala.descricao}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{data}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{horaInicio} - {horaFim}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => handleUpdateStatus(sala.id, EStatusReserva.Aprovado, sala.descricao || '')}
                                                disabled={updateStatus.isPending || !canApproveSalas()}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Aprovar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleUpdateStatus(sala.id, EStatusReserva.Rejeitado, sala.descricao || '')}
                                                disabled={updateStatus.isPending || !canApproveSalas()}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Rejeitar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
