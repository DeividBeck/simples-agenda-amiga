import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EEdicaoRecorrencia, EExclusaoRecorrencia } from '@/types/api';

interface RecurrenceScopeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope: number) => void;
  type: 'edit' | 'delete';
  eventTitle: string;
}

export const RecurrenceScopeDialog: React.FC<RecurrenceScopeDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  eventTitle,
}) => {
  const isEdit = type === 'edit';
  const title = isEdit ? 'Editar Evento Recorrente' : 'Excluir Evento Recorrente';
  const description = isEdit
    ? `Como você deseja editar "${eventTitle}"?`
    : `Como você deseja excluir "${eventTitle}"?`;

  const handleScope = (scope: number) => {
    console.log('RecurrenceScopeDialog - handleScope:', scope);
    onConfirm(scope);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3 py-4">
          <button
            onClick={() => handleScope(isEdit ? EEdicaoRecorrencia.Este : EExclusaoRecorrencia.Este)}
            className="w-full px-4 py-3 text-left border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="font-medium">
              {isEdit ? 'Apenas este evento' : 'Apenas esta ocorrência'}
            </div>
            <div className="text-sm text-muted-foreground">
              {isEdit
                ? 'Este evento será desvinculado da série e editado individualmente'
                : 'Remove apenas esta ocorrência, mantendo as outras'}
            </div>
          </button>

          <button
            onClick={() => handleScope(isEdit ? EEdicaoRecorrencia.EsteEfuturos : EExclusaoRecorrencia.EsteEfuturos)}
            className="w-full px-4 py-3 text-left border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="font-medium">
              {isEdit ? 'Este e futuros eventos' : 'Esta e futuras ocorrências'}
            </div>
            <div className="text-sm text-muted-foreground">
              {isEdit
                ? 'Altera este evento e todos os futuros da série'
                : 'Remove esta ocorrência e todas as futuras'}
            </div>
          </button>

          <button
            onClick={() => handleScope(isEdit ? EEdicaoRecorrencia.Todos : EExclusaoRecorrencia.Todos)}
            className="w-full px-4 py-3 text-left border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="font-medium">Todos os eventos da série</div>
            <div className="text-sm text-muted-foreground">
              {isEdit
                ? 'Altera todos os eventos da série, incluindo os passados'
                : 'Remove todos os eventos desta série'}
            </div>
          </button>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
