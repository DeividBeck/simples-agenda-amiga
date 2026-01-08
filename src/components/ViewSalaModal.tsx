import React from 'react';
import { format } from 'date-fns';
import { MapPin, Clock, Users, CheckCircle, XCircle, AlertCircle, Calendar, Trash2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sala } from '@/types/api';
import { useDeleteSala } from '@/hooks/api/useSalas';
import { useClaims } from '@/hooks/useClaims';
import { useToast } from '@/hooks/use-toast';

interface ViewSalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  sala: Sala | null;
  onEdit?: () => void;
  canEdit: boolean;
}

export const ViewSalaModal: React.FC<ViewSalaModalProps> = ({
  isOpen,
  onClose,
  sala,
  onEdit,
  canEdit
}) => {
  const { canDeleteSalas } = useClaims();
  const deleteSala = useDeleteSala();
  const { toast } = useToast();

  if (!sala) return null;

  const formatDataSala = () => {
    const dataInicio = new Date(sala.dataInicio);
    const dataFim = new Date(sala.dataFim);
    
    if (sala.allDay) {
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

  const getStatusInfo = () => {
    switch (sala.status) {
      case 0: return { text: 'Pendente', icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
      case 1: return { text: 'Aprovado', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' };
      case 2: return { text: 'Rejeitado', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' };
      case 3: return { text: 'Cancelado', icon: XCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' };
      default: return { text: 'Pendente', icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleDeleteSala = async () => {
    try {
      await deleteSala.mutateAsync(sala.id);
      toast({
        title: 'Sala excluída',
        description: `A reserva "${sala.descricao}" foi excluída com sucesso.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao excluir sala',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar excluir a reserva. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5" />
            Reserva de Sala
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo de Sala e Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge 
              variant="outline" 
              className="flex items-center gap-1"
              style={{ borderColor: sala.tipoDeSala?.cor, color: sala.tipoDeSala?.cor }}
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: sala.tipoDeSala?.cor }}
              />
              {sala.tipoDeSala?.nome}
            </Badge>
            <Badge variant="outline" className={`flex items-center gap-1 ${statusInfo.color}`}>
              <StatusIcon className="h-3 w-3" />
              {statusInfo.text}
            </Badge>
          </div>

          {/* Data e Horário */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{formatDataSala()}</p>
              {sala.allDay && (
                <p className="text-sm text-muted-foreground">Reserva de dia inteiro</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Descrição */}
          <div>
            <h3 className="font-medium mb-2">Descrição</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {sala.descricao || 'Sem descrição disponível'}
            </p>
          </div>

          {/* Solicitante */}
          {sala.solicitanteEmail && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Solicitante</h3>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{sala.solicitanteEmail}</span>
                </div>
              </div>
            </>
          )}

          {/* Informações da Sala */}
          {sala.tipoDeSala && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Informações da Sala</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Capacidade: {sala.tipoDeSala.capacidade} pessoas</span>
                  </div>
                  {sala.dataCriacao && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Criado em: {format(new Date(sala.dataCriacao), "dd/MM/yyyy 'às' HH:mm")}
                      </span>
                    </div>
                  )}
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
                  Editar Reserva
                </Button>
              )}
              
              {canDeleteSalas() && (
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
                        Tem certeza que deseja excluir esta reserva de sala? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteSala}
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
