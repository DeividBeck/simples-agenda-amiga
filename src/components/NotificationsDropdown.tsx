import { Bell, MapPin, Calendar, Clock, Check, X, FileText, User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSalasPendentes, useUpdateSalaStatus } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EStatusReserva } from '@/types/api';

export const NotificationsDropdown = () => {
    const { data: salasPendentes } = useSalasPendentes();
    const updateStatus = useUpdateSalaStatus();
    const { toast } = useToast();

    // TODO: Adicionar hook para contratos pendentes quando a API estiver pronta
    const contratosPendentes: any[] = []; // Placeholder

    const totalNotifications = (salasPendentes?.length || 0) + contratosPendentes.length;

    const handleUpdateSalaStatus = async (id: number, status: EStatusReserva, descricao: string) => {
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
            data: format(inicio, "dd/MM/yyyy", { locale: ptBR }),
            horaInicio: format(inicio, 'HH:mm', { locale: ptBR }),
            horaFim: format(fim, 'HH:mm', { locale: ptBR }),
        };
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="relative">
                    <Bell className="h-4 w-4" />
                    {totalNotifications > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-500 text-white text-xs">
                            {totalNotifications > 99 ? '99+' : totalNotifications}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)]">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notificações
                    {totalNotifications > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                            {totalNotifications}
                        </Badge>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <ScrollArea className="max-h-[400px]">
                    {/* Seção: Salas Pendentes */}
                    {salasPendentes && salasPendentes.length > 0 && (
                        <div className="p-2">

                            <div className="space-y-2 mt-2">
                                {salasPendentes.slice(0, 5).map((sala) => {
                                    const { data, horaInicio, horaFim } = formatDataHora(sala.dataInicio, sala.dataFim);
                                    return (
                                        <div
                                            key={sala.id}
                                            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {sala.nomeTipoDeSala || 'Sala'}
                                                    </p>
                                                    {sala.descricao && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {sala.descricao}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{data}</span>
                                                        <Clock className="h-3 w-3 ml-1" />
                                                        <span>{horaInicio} - {horaFim}</span>
                                                    </div>
                                                    {sala.solicitanteEmail && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                            <Mail className="h-3 w-3" />
                                                            <span className="truncate">{sala.solicitanteEmail}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleUpdateSalaStatus(sala.id, EStatusReserva.Aprovado, sala.descricao || '')}
                                                        disabled={updateStatus.isPending}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleUpdateSalaStatus(sala.id, EStatusReserva.Rejeitado, sala.descricao || '')}
                                                        disabled={updateStatus.isPending}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {salasPendentes.length > 5 && (
                                    <p className="text-xs text-center text-muted-foreground py-2">
                                        +{salasPendentes.length - 5} mais solicitações
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Seção: Contratos Pendentes */}
                    {contratosPendentes.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <div className="p-2">
                                <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                    Respostas de Contratos
                                    <Badge variant="outline" className="ml-auto text-xs">
                                        {contratosPendentes.length}
                                    </Badge>
                                </div>
                                <div className="space-y-2 mt-2">
                                    {contratosPendentes.slice(0, 5).map((contrato: any) => (
                                        <div
                                            key={contrato.id}
                                            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {contrato.interessado?.nome}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {contrato.status === 'aceito' ? (
                                                            <span className="text-green-600">Aceitou a reserva</span>
                                                        ) : (
                                                            <span className="text-red-600">Recusou a reserva</span>
                                                        )}
                                                    </p>
                                                </div>
                                                <Badge variant={contrato.status === 'aceito' ? 'default' : 'destructive'}>
                                                    {contrato.status === 'aceito' ? 'Aceito' : 'Recusado'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Estado vazio */}
                    {totalNotifications === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Check className="h-10 w-10 text-green-500 mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Nenhuma notificação pendente
                            </p>
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
