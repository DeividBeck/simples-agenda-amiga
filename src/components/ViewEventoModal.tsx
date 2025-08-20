import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Share2, ExternalLink, Users, MapPin, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Evento } from '@/types/api';
import { useInscricaoLink } from '@/hooks/useInscricaoLink';
import { useDeleteEvento } from '@/hooks/useApi';
import { useClaims } from '@/hooks/useClaims';
import { useToast } from '@/hooks/use-toast';

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

  if (!evento) return null;

  const inscricaoLink = generateInscricaoLink(evento);

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

  const handleDeleteEvento = async () => {
    try {
      await deleteEvento.mutateAsync(evento.id);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* Link de Inscrição */}
          {evento.inscricaoAtiva && inscricaoLink && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Link de Inscrição</h3>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={inscricaoLink}
                    readOnly
                    className="flex-1 bg-transparent text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                  >
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInscricaoLink}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
            
            <div className="flex gap-2">
              {canEdit && onEdit && (
                <Button 
                  onClick={onEdit}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Editar Evento
                </Button>
              )}
              
              {canDeleteEventos() && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
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
                        onClick={handleDeleteEvento}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
