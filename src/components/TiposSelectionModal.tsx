
import React from 'react';
import { Tag, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TiposSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEventos: () => void;
  onSelectSalas: () => void;
}

export const TiposSelectionModal: React.FC<TiposSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectEventos,
  onSelectSalas,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            Escolha o tipo a gerenciar
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelectEventos}>
            <CardContent className="p-6 text-center">
              <Tag className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Tipos de Eventos</h3>
              <p className="text-sm text-gray-600">
                Gerencie categorias de eventos como Missa, Catequese, Eventos Sociais, etc.
              </p>
              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                Gerenciar Eventos
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelectSalas}>
            <CardContent className="p-6 text-center">
              <Building className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Tipos de Salas</h3>
              <p className="text-sm text-gray-600">
                Gerencie espaços físicos como Salão Principal, Salas de Reunião, etc.
              </p>
              <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                Gerenciar Salas
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
