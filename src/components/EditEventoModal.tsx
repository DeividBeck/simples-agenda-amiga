import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Copy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUpdateEvento, useTiposEventos } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { Evento, ENivelCompartilhamento, ENomeFormulario } from '@/types/api';
import { cn } from '@/lib/utils';
import { useInscricaoLink } from '@/hooks/useInscricaoLink';

const formSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  dataInicio: z.date({ required_error: 'Data de início é obrigatória' }),
  dataFim: z.date({ required_error: 'Data de fim é obrigatória' }),
  horaInicio: z.string().optional(),
  horaFim: z.string().optional(),
  allDay: z.boolean().default(false),
  tipoEventoId: z.string().min(1, 'Tipo de evento é obrigatório'),
  inscricaoAtiva: z.boolean().default(false),
  nomeFormulario: z.string().optional(),
  nivelCompartilhamento: z.string().default('0'),
}).refine((data) => {
  // Validação personalizada: se não for dia inteiro, horários são obrigatórios
  if (!data.allDay) {
    return data.horaInicio && data.horaFim;
  }
  return true;
}, {
  message: "Horário de início e fim são obrigatórios quando não for evento de dia inteiro",
  path: ["horaInicio"],
});

type FormData = z.infer<typeof formSchema>;

interface EditEventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  evento: Evento | null;
}

export const EditEventoModal: React.FC<EditEventoModalProps> = ({ isOpen, onClose, evento }) => {
  const { toast } = useToast();
  const { data: tiposEventos } = useTiposEventos();
  const updateEvento = useUpdateEvento();
  const { generateInscricaoLink, copyLinkToClipboard } = useInscricaoLink();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      allDay: false,
      tipoEventoId: '',
      inscricaoAtiva: false,
      nomeFormulario: 'generico',
      nivelCompartilhamento: '0',
    },
  });

  // Verificar se o evento já tem inscrições online ativas
  const hasOnlineRegistration = evento?.inscricaoAtiva && evento?.slug;

  // Atualizar form quando evento mudar
  useEffect(() => {
    if (evento) {
      const dataInicio = new Date(evento.dataInicio);
      const dataFim = new Date(evento.dataFim);

      form.reset({
        titulo: evento.titulo,
        descricao: evento.descricao,
        dataInicio: dataInicio,
        dataFim: dataFim,
        allDay: evento.allDay,
        tipoEventoId: evento.tipoEventoId.toString(),
        inscricaoAtiva: evento.inscricaoAtiva,
        nomeFormulario: evento.nomeFormulario !== null ? evento.nomeFormulario.toString() : 'generico',
        nivelCompartilhamento: evento.nivelCompartilhamento.toString(),
        horaInicio: !evento.allDay ? format(dataInicio, 'HH:mm') : undefined,
        horaFim: !evento.allDay ? format(dataFim, 'HH:mm') : undefined,
      });
    }
  }, [evento, form]);

  const watchAllDay = form.watch('allDay');
  const watchInscricaoAtiva = form.watch('inscricaoAtiva');
  const watchDataInicio = form.watch('dataInicio');

  // Auto-preencher data fim quando não for dia inteiro
  useEffect(() => {
    if (!watchAllDay && watchDataInicio) {
      form.setValue('dataFim', watchDataInicio);
    }
  }, [watchAllDay, watchDataInicio, form]);

  const inscricaoLink = evento ? generateInscricaoLink(evento) : null;

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

  const onSubmit = async (data: FormData) => {
    if (!evento) return;

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

      // Preparar dados no formato que funciona (conforme Postman)
      const eventoAtualizado = {
        titulo: data.titulo,
        descricao: data.descricao,
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        allDay: data.allDay,
        tipoEventoId: parseInt(data.tipoEventoId),
        // Se já tem inscrições online, manter os valores originais
        inscricaoAtiva: hasOnlineRegistration ? evento.inscricaoAtiva : data.inscricaoAtiva,
        nomeFormulario: hasOnlineRegistration ? evento.nomeFormulario : (data.nomeFormulario && data.nomeFormulario !== 'generico' ? parseInt(data.nomeFormulario) as ENomeFormulario : null),
        slug: evento.slug, // Manter o slug original
        nivelCompartilhamento: parseInt(data.nivelCompartilhamento) as ENivelCompartilhamento,
      };

      await updateEvento.mutateAsync({
        id: evento.id,
        data: eventoAtualizado,
      });

      toast({
        title: 'Evento atualizado com sucesso!',
        description: 'As alterações foram salvas.',
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar evento',
        description: 'Ocorreu um erro ao tentar atualizar o evento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (!evento) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título do evento..." {...field} />
                  </FormControl>
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
                      placeholder="Descreva o evento..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipoEventoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Evento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposEventos?.map(tipo => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: tipo.cor }}
                              />
                              {tipo.nome}
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
                name="nivelCompartilhamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Compartilhamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Local (apenas esta paróquia)</SelectItem>
                        <SelectItem value="1">Entre Paróquias</SelectItem>
                        <SelectItem value="2">Diocese (toda a diocese)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Evento de dia inteiro</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Marque se o evento durar o dia todo
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
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
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
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
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

            {/* Seção de Inscrições Online - Desabilitada se já existe */}
            {hasOnlineRegistration ? (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-medium text-gray-800">Inscrições Online</h3>
                    <p className="text-sm text-gray-600">Este evento já possui inscrições online ativas e não pode ser editado para evitar problemas com inscrições existentes.</p>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Ativo
                  </div>
                </div>

                {inscricaoLink && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Link de Inscrição</label>
                    <div className="flex items-center gap-2 p-3 bg-white rounded-md border">
                      <input
                        type="text"
                        value={inscricaoLink}
                        readOnly
                        className="flex-1 bg-transparent text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLink}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Compartilhe este link para que as pessoas possam se inscrever no evento.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="inscricaoAtiva"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Inscrições Online</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Habilitar formulário de inscrição online para este evento
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

                {watchInscricaoAtiva && (
                  <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                    <FormField
                      control={form.control}
                      name="nomeFormulario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Formulário</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o formulário" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="generico">Formulário Genérico</SelectItem>
                              <SelectItem value="0">Preparação para Batismo</SelectItem>
                              <SelectItem value="1">Preparação para Matrimônio</SelectItem>
                              <SelectItem value="2">Catequese</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateEvento.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateEvento.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
