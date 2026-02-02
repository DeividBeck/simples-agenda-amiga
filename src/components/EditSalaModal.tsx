
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, MapPin, CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUpdateSala, useTiposDeSalas } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { Sala, EStatusReserva } from '@/types/api';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  dataInicio: z.date({ required_error: 'Data de início é obrigatória' }),
  dataFim: z.date({ required_error: 'Data de fim é obrigatória' }),
  horaInicio: z.string().optional(),
  horaFim: z.string().optional(),
  allDay: z.boolean().default(false),
  tipoDeSalaId: z.string().min(1, 'Tipo de sala é obrigatório'),
  status: z.string().default('1'),
}).refine((data) => {
  // Validação personalizada: se não for dia inteiro, horários são obrigatórios
  if (!data.allDay) {
    return data.horaInicio && data.horaFim;
  }
  return true;
}, {
  message: "Horário de início e fim são obrigatórios quando não for reserva de dia inteiro",
  path: ["horaInicio"],
});

type FormData = z.infer<typeof formSchema>;

interface EditSalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  sala: Sala | null;
}

export const EditSalaModal: React.FC<EditSalaModalProps> = ({
  isOpen,
  onClose,
  sala,
}) => {
  const { toast } = useToast();
  const updateSala = useUpdateSala();
  const { data: tiposDeSalas } = useTiposDeSalas();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: '',
      allDay: false,
      tipoDeSalaId: '',
      status: '1',
    },
  });

  const watchAllDay = form.watch('allDay');
  const watchDataInicio = form.watch('dataInicio');

  // Auto-preencher data fim quando não for dia inteiro (igual aos eventos)
  useEffect(() => {
    if (!watchAllDay && watchDataInicio) {
      form.setValue('dataFim', watchDataInicio);
    }
  }, [watchAllDay, watchDataInicio, form]);

  // Atualizar form quando sala mudar (usando a mesma lógica dos eventos)
  useEffect(() => {
    if (sala) {
      const dataInicio = new Date(sala.dataInicio);
      const dataFim = new Date(sala.dataFim);

      form.reset({
        descricao: sala.descricao,
        dataInicio: dataInicio,
        dataFim: dataFim,
        allDay: sala.allDay,
        tipoDeSalaId: sala.tipoDeSalaId.toString(),
        status: sala.status.toString(),
        horaInicio: !sala.allDay ? format(dataInicio, 'HH:mm') : undefined,
        horaFim: !sala.allDay ? format(dataFim, 'HH:mm') : undefined,
      });
    }
  }, [sala, form]);

  const onSubmit = async (data: FormData) => {
    if (!sala) return;

    try {

      let dataInicio = data.dataInicio;
      let dataFim = data.dataFim;

      if (!data.allDay && data.horaInicio && data.horaFim) {
        const [horaI, minutoI] = data.horaInicio.split(':').map(Number);
        const [horaF, minutoF] = data.horaFim.split(':').map(Number);

        dataInicio = new Date(data.dataInicio);
        dataInicio.setHours(horaI, minutoI, 0, 0);

        dataFim = new Date(data.dataFim);
        dataFim.setHours(horaF, minutoF, 0, 0);
      }

      const requestData = {
        id: sala.id,
        empresaId: sala.tipoDeSala?.id || 0,
        filialId: sala.tipoDeSala?.id || 0,
        descricao: data.descricao,
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        allDay: data.allDay,
        tipoDeSalaId: parseInt(data.tipoDeSalaId),
        tipoDeSala: null,
        status: parseInt(data.status),
        dataCriacao: sala.dataCriacao,
      };

      await updateSala.mutateAsync({
        id: sala.id,
        data: requestData
      });

      toast({
        title: 'Sala atualizada!',
        description: 'A reserva de sala foi atualizada com sucesso.',
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar sala',
        description: 'Ocorreu um erro ao tentar atualizar a reserva de sala.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!sala) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-w-[95vw] max-h-[88vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Editar Reserva de Sala
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tipoDeSalaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Sala *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o propósito da reserva..."
                      className="min-h-[100px]"
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Reserva de dia inteiro</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Marque se a reserva ocupará o dia todo
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3"
                          locale={ptBR}
                          captionLayout="dropdown-buttons"
                          fromYear={2000}
                          toYear={2100}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={!watchAllDay}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3"
                          locale={ptBR}
                          captionLayout="dropdown-buttons"
                          fromYear={2000}
                          toYear={2100}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!watchAllDay && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="horaInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Início *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horaFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Fim *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status da Reserva</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Pendente</SelectItem>
                      <SelectItem value="1">Aprovado</SelectItem>
                      <SelectItem value="2">Rejeitado</SelectItem>
                      <SelectItem value="3">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
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
                disabled={updateSala.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateSala.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
