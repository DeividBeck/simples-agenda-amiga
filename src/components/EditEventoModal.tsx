import React, { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Copy, Clock, Users, FileText, Building, User, Search } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useUpdateEvento, useTiposEventos, useTiposDeSalas, useInteressados, useCreateInteressado, useInteressado } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { Evento, ENivelCompartilhamento, ENomeFormulario, ERecorrencia, ETipoContrato, Interessado } from '@/types/api';
import { cn } from '@/lib/utils';
import { useInscricaoLink } from '@/hooks/useInscricaoLink';
import { RecurrenceScopeDialog } from './RecurrenceScopeDialog';

// Funções de formatação
const formatCpfCnpj = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

const formatTelefone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  } else {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  }
};

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
  // Campos do interessado
  interessadoId: z.number().optional(),
  interessadoNome: z.string().optional(),
  interessadoDocumento: z.string().optional(),
  interessadoTelefone: z.string().optional(),
  interessadoEmail: z.string().optional(),
}).refine((data) => {
  if (!data.allDay) {
    return data.horaInicio && data.horaFim;
  }
  return true;
}, {
  message: "Horário de início e fim são obrigatórios quando não for evento de dia inteiro",
  path: ["horaInicio"],
}).refine((data) => {
  if (data.recorrencia !== '0') {
    return data.fimRecorrencia;
  }
  return true;
}, {
  message: "Data de fim da recorrência é obrigatória quando evento é recorrente",
  path: ["fimRecorrencia"],
}).refine((data) => {
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
  const { data: interessados } = useInteressados();
  const updateEvento = useUpdateEvento();
  const createInteressado = useCreateInteressado();
  const { generateInscricaoLink, copyLinkToClipboard } = useInscricaoLink();
  const [showScopeDialog, setShowScopeDialog] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [searchInteressado, setSearchInteressado] = useState('');
  const [interessadoSelecionado, setInteressadoSelecionado] = useState<Interessado | null>(null);
  const [showInteressadoSearch, setShowInteressadoSearch] = useState(false);

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
      interessadoId: undefined,
      interessadoNome: '',
      interessadoDocumento: '',
      interessadoTelefone: '',
      interessadoEmail: '',
    },
  });

  // Buscar interessado do evento se existir
  const { data: interessadoDoEvento } = useInteressado(evento?.interessadoId || 0);

  // Verificar se o evento já tem inscrições online ativas
  const hasOnlineRegistration = evento?.inscricaoAtiva && evento?.slug;

  const watchTipoEventoId = form.watch('tipoEventoId');

  // Verificar se o tipo de evento selecionado tem categoria de contrato
  const tipoEventoSelecionado = useMemo(() => {
    if (!watchTipoEventoId || !tiposEventos) return null;
    return tiposEventos.find(t => t.id.toString() === watchTipoEventoId);
  }, [watchTipoEventoId, tiposEventos]);

  const showInteressadoSection = tipoEventoSelecionado &&
    tipoEventoSelecionado.categoriaContrato !== ETipoContrato.Nenhum;

  // Filtrar interessados na busca
  const interessadosFiltrados = useMemo(() => {
    if (!interessados || !searchInteressado) return interessados || [];
    const search = searchInteressado.toLowerCase();
    return interessados.filter(i =>
      i.nome.toLowerCase().includes(search) ||
      i.documento.includes(search) ||
      i.email.toLowerCase().includes(search)
    );
  }, [interessados, searchInteressado]);

  // Atualizar form quando evento mudar
  useEffect(() => {
    if (evento) {
      const dataInicio = new Date(evento.dataInicio);
      const dataFim = new Date(evento.dataFim);

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
        tipoEventoId: evento.tipoEvento?.id != null ? evento.tipoEvento.id.toString() : (evento.tipoEventoId != null ? evento.tipoEventoId.toString() : ''),
        inscricaoAtiva: evento.inscricaoAtiva ?? false,
        nomeFormulario: evento.nomeFormulario != null ? evento.nomeFormulario.toString() : 'generico',
        nivelCompartilhamento: evento.nivelCompartilhamento != null ? evento.nivelCompartilhamento.toString() : '0',
        horaInicio: !evento.allDay && dataInicio ? format(dataInicio, 'HH:mm') : undefined,
        horaFim: !evento.allDay && dataFim ? format(dataFim, 'HH:mm') : undefined,
        recorrencia: recorrenciaValue,
        fimRecorrencia: fimRecorrenciaValue,
        salaAtiva: !!evento.sala,
        tipoDeSalaId: evento.sala?.tipoDeSalaId?.toString() || '',
        salaDescricao: evento.sala?.descricao || '',
        interessadoId: evento.interessadoId || undefined,
        interessadoNome: '',
        interessadoDocumento: '',
        interessadoTelefone: '',
        interessadoEmail: '',
      });

      // Limpar interessado selecionado ao trocar de evento
      setInteressadoSelecionado(null);
    }
  }, [evento, form]);

  // Preencher dados do interessado quando carregar
  useEffect(() => {
    if (interessadoDoEvento && evento?.interessadoId) {
      setInteressadoSelecionado(interessadoDoEvento);
      form.setValue('interessadoId', interessadoDoEvento.id);
      form.setValue('interessadoNome', interessadoDoEvento.nome);
      form.setValue('interessadoDocumento', formatCpfCnpj(interessadoDoEvento.documento));
      form.setValue('interessadoTelefone', formatTelefone(interessadoDoEvento.telefone));
      form.setValue('interessadoEmail', interessadoDoEvento.email);
    }
  }, [interessadoDoEvento, evento?.interessadoId, form]);

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

  const handleSelectInteressado = (interessado: Interessado) => {
    setInteressadoSelecionado(interessado);
    setShowInteressadoSearch(false);
    form.setValue('interessadoId', interessado.id);
    form.setValue('interessadoNome', interessado.nome);
    form.setValue('interessadoDocumento', formatCpfCnpj(interessado.documento));
    form.setValue('interessadoTelefone', formatTelefone(interessado.telefone));
    form.setValue('interessadoEmail', interessado.email);
  };

  const handleClearInteressado = () => {
    setInteressadoSelecionado(null);
    form.setValue('interessadoId', undefined);
    form.setValue('interessadoNome', '');
    form.setValue('interessadoDocumento', '');
    form.setValue('interessadoTelefone', '');
    form.setValue('interessadoEmail', '');
  };

  const getCategoriaLabel = (categoria: ETipoContrato) => {
    switch (categoria) {
      case ETipoContrato.Casamento:
        return 'Casamento';
      case ETipoContrato.Diverso:
        return 'Diverso';
      default:
        return '';
    }
  };

  const isRecurring = evento && (
    (evento.recorrencia !== undefined && evento.recorrencia !== ERecorrencia.NaoRepete) ||
    evento.eventoPaiId != null
  );

  const onSubmit = async (data: FormData) => {
    if (!evento) return;

    if (isRecurring) {
      setPendingData(data);
      setShowScopeDialog(true);
      return;
    }

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

      let interessadoId = data.interessadoId;

      // Se tem categoria de contrato e não tem interessado selecionado, criar novo
      if (showInteressadoSection && !interessadoId && data.interessadoNome && data.interessadoDocumento && data.interessadoTelefone && data.interessadoEmail) {
        try {
          const novoInteressado = await createInteressado.mutateAsync({
            nome: data.interessadoNome,
            documento: data.interessadoDocumento.replace(/\D/g, ''),
            telefone: data.interessadoTelefone.replace(/\D/g, ''),
            email: data.interessadoEmail,
            cep: null,
            rua: null,
            numero: null,
            bairro: null,
            cidade: null,
            estado: null,
            pontoReferencia: null,
            emailFinanceiro: null,
          });
          interessadoId = novoInteressado.id;
        } catch (error: any) {
          toast({
            title: 'Erro ao criar contratante.',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }
      }

      const novaSala = data.salaAtiva && data.tipoDeSalaId ? {
        descricao: data.salaDescricao || '',
        tipoDeSalaId: parseInt(data.tipoDeSalaId),
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        allDay: data.allDay,
      } : null;

      const eventoAtualizado: Record<string, any> = {
        ...evento,
        titulo: data.titulo,
        descricao: data.descricao,
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        allDay: data.allDay,
        tipoEventoId: parseInt(data.tipoEventoId),
        inscricaoAtiva: hasOnlineRegistration ? evento.inscricaoAtiva : data.inscricaoAtiva,
        nomeFormulario: hasOnlineRegistration ? evento.nomeFormulario : (data.nomeFormulario && data.nomeFormulario !== 'generico' ? parseInt(data.nomeFormulario) as ENomeFormulario : null),
        slug: evento.slug,
        nivelCompartilhamento: parseInt(data.nivelCompartilhamento) as ENivelCompartilhamento,
        novaSala: novaSala,
        tipoEvento: evento.tipoEvento,
      };

      // Incluir interessadoId se existir
      if (interessadoId) {
        eventoAtualizado.interessadoId = interessadoId;
      }

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
                              {tipo.categoriaContrato !== ETipoContrato.Nenhum && (
                                <Badge variant="outline" className="ml-1 text-xs">
                                  {getCategoriaLabel(tipo.categoriaContrato)}
                                </Badge>
                              )}
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
                        <SelectItem value="0">Local</SelectItem>
                        <SelectItem value="1">Entre Paróquias</SelectItem>
                        <SelectItem value="2">Diocese</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Seção do Contratante - Aparece apenas quando tipo de evento tem categoria de contrato */}
            {showInteressadoSection && (
              <Accordion type="single" defaultValue="interessado" collapsible className="w-full">
                <AccordionItem value="interessado" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Dados do Contratante</span>
                      <Badge variant="secondary" className="ml-2">
                        {getCategoriaLabel(tipoEventoSelecionado!.categoriaContrato)}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {/* Busca de contratante existente */}
                      <div className="space-y-2">
                        <FormLabel>Buscar Contratante Existente</FormLabel>
                        <Popover open={showInteressadoSearch} onOpenChange={setShowInteressadoSearch}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {interessadoSelecionado ? (
                                <span className="truncate">{interessadoSelecionado.nome}</span>
                              ) : (
                                <span className="text-muted-foreground">Buscar por nome, documento ou email...</span>
                              )}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Digite para buscar..."
                                value={searchInteressado}
                                onValueChange={setSearchInteressado}
                              />
                              <CommandList>
                                <CommandEmpty>Nenhum contratante encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {interessadosFiltrados?.map((interessado) => (
                                    <CommandItem
                                      key={interessado.id}
                                      onSelect={() => handleSelectInteressado(interessado)}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">{interessado.nome}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatCpfCnpj(interessado.documento)} • {interessado.email}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {interessadoSelecionado && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClearInteressado}
                            className="text-destructive"
                          >
                            Limpar seleção (criar novo)
                          </Button>
                        )}
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          {interessadoSelecionado
                            ? 'Dados do contratante selecionado (somente leitura):'
                            : 'Ou preencha os dados para criar um novo contratante:'}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="interessadoNome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome / Razão Social *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Nome completo ou razão social..."
                                    {...field}
                                    disabled={!!interessadoSelecionado}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="interessadoDocumento"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CPF / CNPJ *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="000.000.000-00"
                                    {...field}
                                    disabled={!!interessadoSelecionado}
                                    onChange={(e) => {
                                      const formatted = formatCpfCnpj(e.target.value);
                                      field.onChange(formatted);
                                    }}
                                    maxLength={18}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="interessadoTelefone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="(00) 00000-0000"
                                    {...field}
                                    disabled={!!interessadoSelecionado}
                                    onChange={(e) => {
                                      const formatted = formatTelefone(e.target.value);
                                      field.onChange(formatted);
                                    }}
                                    maxLength={15}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="interessadoEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>E-mail *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    {...field}
                                    disabled={!!interessadoSelecionado}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

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

            {/* Campos de Recorrência */}
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

            {/* Seção de Reserva de Sala */}
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

            {/* Seção de Inscrições Online */}
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
                disabled={updateEvento.isPending || createInteressado.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateEvento.isPending || createInteressado.isPending ? 'Salvando...' : 'Salvar Alterações'}
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
