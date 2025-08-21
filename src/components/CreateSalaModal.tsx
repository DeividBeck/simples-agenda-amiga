
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateSala, useTiposDeSalas } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { EStatusReserva } from '@/types/api';

const formSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().min(1, 'Data de fim é obrigatória'),
  allDay: z.boolean(),
  tipoDeSalaId: z.number().min(1, 'Tipo de sala é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

interface CreateSalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
}

export const CreateSalaModal: React.FC<CreateSalaModalProps> = ({
  isOpen,
  onClose,
  initialDate,
}) => {
  const { toast } = useToast();
  const createSala = useCreateSala();
  const { data: tiposDeSalas } = useTiposDeSalas();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: '',
      dataInicio: initialDate ? new Date(initialDate.getTime() - initialDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      dataFim: initialDate ? new Date(new Date(initialDate).getTime() + 60 * 60 * 1000 - initialDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      allDay: false,
      tipoDeSalaId: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {

      const requestData = {
        descricao: data.descricao,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        allDay: data.allDay,
        tipoDeSalaId: data.tipoDeSalaId,
        status: EStatusReserva.Pendente, // Sempre aprovado como solicitado
      };

      await createSala.mutateAsync(requestData);

      toast({
        title: 'Sala criada!',
        description: 'A reserva de sala foi criada com sucesso.',
      });

      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao criar sala',
        description: 'Ocorreu um erro ao tentar criar a reserva de sala.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Nova Reserva de Sala
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipoDeSalaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Sala</FormLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de sala" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposDeSalas?.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tipo.cor }}
                            />
                            {tipo.nome} ({tipo.capacidade} pessoas)
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o propósito da reserva..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Dia inteiro</FormLabel>
                    <div className="text-sm text-gray-500">
                      A reserva ocupará o dia todo
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data e Hora de Início
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Data e Hora de Fim
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createSala.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {createSala.isPending ? 'Criando...' : 'Criar Reserva'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
