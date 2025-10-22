
import React, { useState } from 'react';
import { Plus, Palette, Tag, Lock, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ColorSelector } from './ColorSelector';
import { EditTipoEventoModal } from './EditTipoEventoModal';
import { useTiposEventos, useCreateTipoEvento, useDeleteTipoEvento } from '@/hooks/useApi';
import { useClaims } from '@/hooks/useClaims';
import { useToast } from '@/hooks/use-toast';
import { TipoEvento } from '@/types/api';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cor: z.string().min(1, 'Cor é obrigatória'),
});

type FormData = z.infer<typeof formSchema>;

interface TiposEventosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TiposEventosModal: React.FC<TiposEventosModalProps> = ({ isOpen, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTipoEvento, setSelectedTipoEvento] = useState<TipoEvento | null>(null);
  const { toast } = useToast();
  const { canReadTiposEventos, canCreateTiposEventos, canEditTiposEventos, canDeleteTiposEventos } = useClaims();
  const { data: tiposEventos, isLoading } = useTiposEventos();
  const createTipoEvento = useCreateTipoEvento();
  const deleteTipoEvento = useDeleteTipoEvento();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      cor: '#3b82f6',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createTipoEvento.mutateAsync({
        nome: data.nome,
        cor: data.cor,
      });

      toast({
        title: 'Tipo de evento criado!',
        description: 'O novo tipo de evento foi adicionado com sucesso.',
      });

      form.reset();
      setShowForm(false);
    } catch (error) {
      toast({
        title: 'Erro ao criar tipo',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar criar o tipo de evento.',
        variant: 'destructive',
      });
    }
  };

  const handleEditTipoEvento = (tipoEvento: TipoEvento) => {
    setSelectedTipoEvento(tipoEvento);
    setShowEditModal(true);
  };

  const handleDeleteTipoEvento = async (id: number, nome: string) => {
    try {
      await deleteTipoEvento.mutateAsync(id);
      toast({
        title: 'Tipo de evento excluído',
        description: `O tipo "${nome}" foi excluído com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar excluir o tipo de evento.',
        variant: 'destructive',
      });
    }
  };  

  const handleClose = () => {
    setShowForm(false);
    setShowEditModal(false);
    setSelectedTipoEvento(null);
    form.reset();
    onClose();
  };

  const handleCreateClick = () => {
    if (!canCreateTiposEventos()) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para criar tipos de eventos.",
        variant: "destructive",
      });
      return;
    }
    setShowForm(!showForm);
  };

  // Se não pode ler tipos de eventos, mostrar mensagem de acesso negado
  if (!canReadTiposEventos()) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tipos de Eventos
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Acesso Restrito</h3>
              <p className="text-gray-500">Você não tem permissão para visualizar tipos de eventos.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-w-[95vw] max-h-[88vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tipos de Eventos
            </div>
            {canCreateTiposEventos() ? (
              <Button 
                onClick={handleCreateClick}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Tipo
              </Button>
            ) : (
              <Button 
                disabled
                size="sm"
                variant="outline"
              >
                <Lock className="h-4 w-4 mr-2" />
                Sem permissão
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário para criar novo tipo */}
          {showForm && canCreateTiposEventos() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="h-5 w-5" />
                  Criar Novo Tipo de Evento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Tipo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Missa, Catequese, Evento Social..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cor"
                      render={({ field }) => (
                        <ColorSelector
                          value={field.value}
                          onChange={field.onChange}
                          label="Cor do Tipo"
                        />
                      )}
                    />

                    <div className="flex gap-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowForm(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createTipoEvento.isPending}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {createTipoEvento.isPending ? 'Criando...' : 'Criar Tipo'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Lista de tipos existentes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Tipos Existentes ({tiposEventos?.length || 0})
            </h3>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tiposEventos?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum tipo cadastrado</h3>
                  <p className="text-gray-500">Crie o primeiro tipo de evento para começar a organizar.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {tiposEventos?.map(tipo => (
                   <Card key={tipo.id} className="hover:shadow-md transition-shadow">
                     <CardContent className="p-6">
                       <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center gap-3">
                           <div 
                             className="w-6 h-6 rounded-full"
                             style={{ backgroundColor: tipo.cor }}
                           />
                           <h4 className="font-semibold text-gray-800">{tipo.nome}</h4>
                         </div>
                         
                         {(canEditTiposEventos() || canDeleteTiposEventos()) && (
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                 <MoreVertical className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="bg-white">
                               {canEditTiposEventos() && (
                                 <DropdownMenuItem onClick={() => handleEditTipoEvento(tipo)}>
                                   <Edit className="h-4 w-4 mr-2" />
                                   Editar
                                 </DropdownMenuItem>
                               )}
                               {canDeleteTiposEventos() && (
                                 <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                     <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                       <Trash2 className="h-4 w-4 mr-2" />
                                       Excluir
                                     </DropdownMenuItem>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent>
                                     <AlertDialogHeader>
                                       <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                       <AlertDialogDescription>
                                         Tem certeza que deseja excluir o tipo de evento "{tipo.nome}"? 
                                         Esta ação não pode ser desfeita e pode afetar eventos existentes.
                                       </AlertDialogDescription>
                                     </AlertDialogHeader>
                                     <AlertDialogFooter>
                                       <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                       <AlertDialogAction
                                         onClick={() => handleDeleteTipoEvento(tipo.id, tipo.nome)}
                                         className="bg-red-600 hover:bg-red-700"
                                       >
                                         Excluir
                                       </AlertDialogAction>
                                     </AlertDialogFooter>
                                   </AlertDialogContent>
                                 </AlertDialog>
                               )}
                             </DropdownMenuContent>
                           </DropdownMenu>
                         )}
                       </div>
                       
                       <Badge 
                         style={{ 
                           backgroundColor: tipo.cor + '20',
                           color: tipo.cor,
                           border: `1px solid ${tipo.cor}40`
                         }}
                       >
                         ID: {tipo.id}
                       </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Edição */}
        <EditTipoEventoModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTipoEvento(null);
          }}
          tipoEvento={selectedTipoEvento}
        />
      </DialogContent>
    </Dialog>
  );
};
