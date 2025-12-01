import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Copy, Clock, Users, FileText, Building } from 'lucide-react';
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
import { useUpdateEvento, useTiposEventos, useTiposDeSalas } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { Evento, ENivelCompartilhamento, ENomeFormulario, ERecorrencia } from '@/types/api';
import { cn } from '@/lib/utils';
import { useInscricaoLink } from '@/hooks/useInscricaoLink';
import { RecurrenceScopeDialog } from './RecurrenceScopeDialog';

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
  recorrencia: z.string().default('0'),
  fimRecorrencia: z.date().optional(),
  // Campos de sala
  salaAtiva: z.boolean().default(false),
  tipoDeSalaId: z.string().optional(),
  salaDescricao: z.string().optional(),
}).refine((data) => {
  // Validação personalizada: se não for dia inteiro, horários são obrigatórios
  if (!data.allDay) {
    return data.horaInicio && data.horaFim;
  }
  return true;
}, {
  message: "Horário de início e fim são obrigatórios quando não for evento de dia inteiro",
  path: ["horaInicio"],
}).refine((data) => {
  // Validação: se recorrência for ativada, data fim de recorrência é obrigatória
  if (data.recorrencia !== '0') {
    return data.fimRecorrencia;
  }
  return true;
}, {
  message: "Data de fim da recorrência é obrigatória quando evento é recorrente",
  path: ["fimRecorrencia"],
}).refine((data) => {
  // Validação: se sala ativa, tipo de sala é obrigatório
  if (data.salaAtiva) {
    return !!data.tipoDeSalaId;
  }
  return true;
}, {
  message: "Tipo de sala é obrigatório quando reserva de sala está ativa",
  path: ["tipoDeSalaId"],
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
  const { data: tiposSalas } = useTiposDeSalas();
  const updateEvento = useUpdateEvento();
  const { generateInscricaoLink, copyLinkToClipboard } = useInscricaoLink();
  const [showScopeDialog, setShowScopeDialog] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);

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
      recorrencia: '0',
      fimRecorrencia: undefined,
      salaAtiva: false,
      tipoDeSalaId: '',
      salaDescricao: '',
    },
  });

  // Verificar se o evento já tem inscrições online ativas
  const hasOnlineRegistration = evento?.inscricaoAtiva && evento?.slug;

  // Atualizar form quando evento mudar
  useEffect(() => {
    if (evento) {
      const dataInicio = new Date(evento.dataInicio);
      const dataFim = new Date(evento.dataFim);

      // Para eventos filhos, usar recorrência do pai
      const recorrenciaValue = evento.eventoPaiId != null && evento.eventoPai
        ? evento.eventoPai.recorrencia?.toString() ?? '0'
        : evento.recorrencia?.toString() ?? '0';

      const fimRecorrenciaValue = evento.eventoPaiId != null && evento.eventoPai
        ? evento.eventoPai.fimRecorrencia ? new Date(evento.eventoPai.fimRecorrencia) : undefined
        : evento.fimRecorrencia ? new Date(evento.fimRecorrencia) : undefined;

      form.reset({
        titulo: evento.titulo || '',
        descricao: evento.descricao || '',
        dataInicio: dataInicio,
        dataFim: dataFim,
        allDay: evento.allDay ?? false,
        // Corrigido: usar evento.tipoEvento.id em vez de evento.tipoEventoId
        tipoEventoId: evento.tipoEvento?.id != null ? evento.tipoEvento.id.toString() : (evento.tipoEventoId != null ? evento.tipoEventoId.toString() : ''),
        inscricaoAtiva: evento.inscricaoAtiva ?? false,
        nomeFormulario: evento.nomeFormulario != null ? evento.nomeFormulario.toString() : 'generico',
        nivelCompartilhamento: evento.nivelCompartilhamento != null ? evento.nivelCompartilhamento.toString() : '0',
        horaInicio: !evento.allDay && dataInicio ? format(dataInicio, 'HH:mm') : undefined,
        horaFim: !evento.allDay && dataFim ? format(dataFim, 'HH:mm') : undefined,
        recorrencia: recorrenciaValue,
        fimRecorrencia: fimRecorrenciaValue,
        // Campos de sala
        salaAtiva: !!evento.sala,
        tipoDeSalaId: evento.sala?.tipoDeSalaId?.toString() || '',
        salaDescricao: evento.sala?.descricao || '',
      });
    }
  }, [evento, form]);

  const watchAllDay = form.watch('allDay');
  const watchInscricaoAtiva = form.watch('inscricaoAtiva');
  const watchDataInicio = form.watch('dataInicio');
  const watchRecorrencia = form.watch('recorrencia');
  const watchSalaAtiva = form.watch('salaAtiva');

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

  // Evento é recorrente se: tem recorrencia > 0 OU se é filho de um evento recorrente (eventoPaiId != null)
  const isRecurring = evento && (
    (evento.recorrencia !== undefined && evento.recorrencia !== ERecorrencia.NaoRepete) ||
    evento.eventoPaiId != null
  );

  const onSubmit = async (data: FormData) => {
    if (!evento) return;

    // Se for evento recorrente, mostrar diálogo de escopo
    if (isRecurring) {
      setPendingData(data);
      setShowScopeDialog(true);
      return;
    }

    // Executar atualização normal
    await executeUpdate(data);
  };

  const executeUpdate = async (data: FormData, scope?: number) => {
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

      // Preparar novaSala se sala estiver ativa
      const novaSala = data.salaAtiva && data.tipoDeSalaId ? {
        descricao: data.salaDescricao || '',
        tipoDeSalaId: parseInt(data.tipoDeSalaId),
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        allDay: data.allDay,
      } : null;

      // Preparar dados no formato que funciona (conforme Postman)
      const eventoAtualizado = {
        ...evento,
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
        novaSala: novaSala,
        tipoEvento: evento.tipoEvento,
      };

      await updateEvento.mutateAsync({
        id: evento.id,
        data: eventoAtualizado,
        scope,
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

  const handleScopeConfirm = async (scope: number) => {
    if (pendingData) {
      await executeUpdate(pendingData, scope);
      setPendingData(null);
    }
  };

  if (!evento) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-w-[95vw] max-h-[88vh] overflow-y-auto mx-auto">
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
                    <FormLabel className="font-medium mb-2">
                      Nível de Compartilhamento
                    </FormLabel>
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

            {/* Campos de Recorrência - não editáveis se já existe recorrência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recorrencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Recorrência
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isRecurring}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a recorrência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Não Repete</SelectItem>
                        <SelectItem value="1">Diariamente</SelectItem>
                        <SelectItem value="2">Semanalmente</SelectItem>
                        <SelectItem value="3">Quinzenalmente</SelectItem>
                        <SelectItem value="4">Mensalmente</SelectItem>
                      </SelectContent>
                    </Select>
                    {isRecurring && (
                      <p className="text-xs text-muted-foreground">
                        {evento?.eventoPaiId != null
                          ? 'Este evento faz parte de uma série recorrente.'
                          : 'Este evento já é recorrente. Use o diálogo de escopo para editar.'}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchRecorrencia !== '0' && !isRecurring && (
                <FormField
                  control={form.control}
                  name="fimRecorrencia"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fim da Recorrência *</FormLabel>
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
              )}
            </div>

            {/* Seção de Reserva de Sala - Editável */}
            <FormField
              control={form.control}
              name="salaAtiva"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Reserva de Sala</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Vincular uma sala a este evento
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

            {watchSalaAtiva && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-4 border border-green-200 dark:border-green-800">
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
                          {tiposSalas?.map(tipo => (
                            <SelectItem key={tipo.id} value={tipo.id.toString()}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: tipo.cor }}
                                />
                                {tipo.nome} (Cap: {tipo.capacidade})
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
                  name="salaDescricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição da Reserva</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição ou observação sobre a reserva..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isRecurring && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Ao editar a sala de um evento recorrente, a mudança será aplicada de acordo com o escopo selecionado (este, este e futuros, ou todos).
                  </p>
                )}
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
                          <FormLabel className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            Tipo de Formulário
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o formulário" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Preparação para Batismo</SelectItem>
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

      {isRecurring && (
        <RecurrenceScopeDialog
          isOpen={showScopeDialog}
          onClose={() => setShowScopeDialog(false)}
          onConfirm={handleScopeConfirm}
          type="edit"
          eventTitle={evento?.titulo || ''}
        />
      )}
    </Dialog>
  );
};
