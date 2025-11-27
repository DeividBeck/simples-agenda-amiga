import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Share2, ExternalLink, Users, MapPin, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Evento, ERecorrencia } from '@/types/api';
import { useInscricaoLink } from '@/hooks/useInscricaoLink';
import { useDeleteEvento } from '@/hooks/useApi';
import { useClaims } from '@/hooks/useClaims';
import { useToast } from '@/hooks/use-toast';
import { RecurrenceScopeDialog } from './RecurrenceScopeDialog';

interface ViewEventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  evento: Evento | null;
  onEdit?: () => void;
  canEdit: boolean;
}

export const ViewEventoModal: React.FC<ViewEventoModalProps> = ({
  isOpen,
  onClose,
  evento,
  onEdit,
  canEdit
}) => {
  const { toast } = useToast();
  const { canDeleteEventos } = useClaims();
  const deleteEvento = useDeleteEvento();
  const { generateInscricaoLink, copyLinkToClipboard } = useInscricaoLink();
  const [showDeleteScopeDialog, setShowDeleteScopeDialog] = useState(false);

  if (!evento) return null;

  const inscricaoLink = generateInscricaoLink(evento);
  // Evento é recorrente se tem recorrência configurada OU se está vinculado a um evento pai
  const isRecurring =
    (evento.recorrencia !== undefined && evento.recorrencia !== ERecorrencia.NaoRepete) ||
    (evento.eventoPaiId !== undefined && evento.eventoPaiId !== null);

  // Recorrência efetiva (usa dados do evento pai quando for ocorrência filha)
  const effectiveRecorrencia =
    evento.recorrencia !== undefined && evento.recorrencia !== ERecorrencia.NaoRepete
      ? evento.recorrencia
      : evento.eventoPai?.recorrencia;

  const effectiveFimRecorrencia =
    evento.fimRecorrencia ?? evento.eventoPai?.fimRecorrencia ?? null;

  const handleCopyLink = async () => {
    if (inscricaoLink) {
      const success = await copyLinkToClipboard(inscricaoLink);
      if (success) {
        toast({
          title: 'Link copiado!',
          description: 'O link de inscrição foi copiado para a área de transferência.',
        });
      }
    }
  };

  const handleOpenInscricaoLink = () => {
    if (inscricaoLink) {
      window.open(inscricaoLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteClick = () => {
    if (!evento) return;

    // Se for evento recorrente, mostrar diálogo de escopo diretamente
    if (isRecurring) {
      setShowDeleteScopeDialog(true);
      return;
    }

    // Para eventos não recorrentes, mostrar confirmação padrão via AlertDialog
  };

  const executeDelete = async (scope?: number) => {
    try {
      await deleteEvento.mutateAsync({ id: evento.id, scope });
      toast({
        title: 'Evento excluído',
        description: `O evento "${evento.titulo}" foi excluído com sucesso.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao excluir evento',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar excluir o evento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteScopeConfirm = async (scope: number) => {
    await executeDelete(scope);
  };

  const formatDataEvento = () => {
    const dataInicio = new Date(evento.dataInicio);
    const dataFim = new Date(evento.dataFim);

    if (evento.allDay) {
      return format(dataInicio, "dd/MM/yyyy");
    } else {
      const isSameDay = dataInicio.toDateString() === dataFim.toDateString();
      if (isSameDay) {
        return `${format(dataInicio, "dd/MM/yyyy")} - ${format(dataInicio, "HH:mm")} às ${format(dataFim, "HH:mm")}`;
      } else {
        return `${format(dataInicio, "dd/MM/yyyy HH:mm")} até ${format(dataFim, "dd/MM/yyyy HH:mm")}`;
      }
    }
  };

  const getNivelCompartilhamentoText = () => {
    switch (evento.nivelCompartilhamento) {
      case 0: return 'Local (apenas esta paróquia)';
      case 1: return 'Entre Paróquias';
      case 2: return 'Diocese (toda a diocese)';
      default: return 'Local';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            {evento.titulo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo e Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className="flex items-center gap-1"
              style={{ borderColor: evento.tipoEvento.cor, color: evento.tipoEvento.cor }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: evento.tipoEvento.cor }}
              />
              {evento.tipoEvento.nome}
            </Badge>
            {evento.inscricaoAtiva && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Inscrições Ativas
              </Badge>
            )}
          </div>

          {/* Data e Horário */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{formatDataEvento()}</p>
              {evento.allDay && (
                <p className="text-sm text-muted-foreground">Evento de dia inteiro</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Descrição */}
          <div>
            <h3 className="font-medium mb-2">Descrição</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{evento.descricao}</p>
          </div>

          {/* Nível de Compartilhamento */}
          <div>
            <h3 className="font-medium mb-2">Nível de Compartilhamento</h3>
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{getNivelCompartilhamentoText()}</span>
            </div>
          </div>

          {/* Informações de Sala */}
          {evento.sala && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Sala Reservada</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {evento.sala.tipoDeSala?.nome ?? evento.sala.nomeTipoDeSala ?? 'Tipo não especificado'}
                    </span>
                  </div>
                  {evento.sala.descricao && (
                    <p className="text-sm text-muted-foreground ml-6">
                      {evento.sala.descricao}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Informações de Recorrência */}
          {isRecurring && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Recorrência</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {effectiveRecorrencia === ERecorrencia.Diariamente && 'Repete diariamente'}
                      {effectiveRecorrencia === ERecorrencia.Semanalmente && 'Repete semanalmente'}
                      {effectiveRecorrencia === ERecorrencia.Quinzenalmente && 'Repete quinzenalmente'}
                      {effectiveRecorrencia === ERecorrencia.Mensalmente && 'Repete mensalmente'}
                    </span>
                  </div>
                  {effectiveFimRecorrencia && (
                    <p className="text-sm text-muted-foreground ml-6">
                      Até {format(new Date(effectiveFimRecorrencia), "dd/MM/yyyy")}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Link de Inscrição */}
          {evento.inscricaoAtiva && inscricaoLink && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Link de Inscrição</h3>
                <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2 w-full">
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      value={inscricaoLink}
                      readOnly
                      className="flex-1 bg-transparent text-sm min-w-0"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="flex-1 sm:flex-none"
                    >
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenInscricaoLink}
                      className="flex-1 sm:flex-none"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 order-3 sm:order-1"
            >
              Fechar
            </Button>

            <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
              {canEdit && onEdit && (
                <Button
                  onClick={onEdit}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  Editar Evento
                </Button>
              )}

              {canDeleteEventos() && (
                <>
                  {isRecurring ? (
                    <Button
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                      onClick={handleDeleteClick}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o evento "{evento.titulo}"?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => executeDelete()}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {isRecurring && (
        <RecurrenceScopeDialog
          isOpen={showDeleteScopeDialog}
          onClose={() => setShowDeleteScopeDialog(false)}
          onConfirm={handleDeleteScopeConfirm}
          type="delete"
          eventTitle={evento.titulo}
        />
      )}
    </Dialog>
  );
};
