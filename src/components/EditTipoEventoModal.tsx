import React, { useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ColorSelector } from './ColorSelector';
import { useUpdateTipoEvento } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { TipoEvento } from '@/types/api';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cor: z.string().min(1, 'Cor é obrigatória'),
});

type FormData = z.infer<typeof formSchema>;

interface EditTipoEventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoEvento: TipoEvento | null;
}

export const EditTipoEventoModal: React.FC<EditTipoEventoModalProps> = ({ 
  isOpen, 
  onClose, 
  tipoEvento 
}) => {
  const { toast } = useToast();
  const updateTipoEvento = useUpdateTipoEvento();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      cor: '#22c55e',
    },
  });

  // Preencher formulário quando tipoEvento mudar
  useEffect(() => {
    if (tipoEvento) {
      form.reset({
        nome: tipoEvento.nome,
        cor: tipoEvento.cor,
      });
    }
  }, [tipoEvento, form]);

  const onSubmit = async (data: FormData) => {
    if (!tipoEvento) return;

    try {
      const updatedData: TipoEvento = {
        ...tipoEvento,
        nome: data.nome,
        cor: data.cor,
      };

      await updateTipoEvento.mutateAsync({ id: tipoEvento.id, data: updatedData });

      toast({
        title: 'Tipo de evento atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      });

      handleClose();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar atualizar o tipo de evento.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!tipoEvento) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editar Tipo de Evento
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Evento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Missa, Reunião, Evento Especial..." {...field} />
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
                  label="Cor do Evento"
                />
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={updateTipoEvento.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateTipoEvento.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};