
import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Copy, User, ChevronDown, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useCreateEvento, useTiposEventos, useTiposDeSalas, useInteressados, useCreateInteressado, useUpdateReserva } from '@/hooks/useApi';
import { CreateEventoRequest, ENivelCompartilhamento, ENomeFormulario, ERecorrencia, ETipoContrato, Interessado, Evento } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Clock, Users, FileText, Mail, Phone, Building2, DollarSign, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Funções de formatação
const formatCpfCnpj = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    // CPF: XXX.XXX.XXX-XX
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: XX.XXX.XXX/XXXX-XX
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
    // Telefone fixo: (XX) XXXX-XXXX
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  } else {
    // Celular: (XX) XXXXX-XXXX
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  }
};
const formatIntegerForInput = (value: number | undefined): string => {
  if (value === undefined || value === null) return '';
  return value.toLocaleString('pt-BR');
};

const formatCurrencyForInput = (value: number | undefined): string => {
  if (value === undefined || value === null) return '';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Função auxiliar para recalcular valores das parcelas
const recalculateParcelasValues = (currentParcelas: ParcelaForm[], total: number | undefined, sinal: number | undefined) => {
  if (currentParcelas.length === 0) return currentParcelas;

  const totalValue = total || 0;
  const sinalValue = sinal || 0;
  const remaining = Math.max(0, totalValue - sinalValue);

  const count = currentParcelas.length;
  const baseValue = Math.floor((remaining / count) * 100) / 100;
  const totalDistributed = baseValue * count;
  const remainder = Math.round((remaining - totalDistributed) * 100) / 100;

  return currentParcelas.map((p, index) => {
    let value = baseValue;
    if (index === 0) {
      value = Number((value + remainder).toFixed(2));
    }
    return { ...p, valor: value };
  });
};

// Interface para parcelas
interface ParcelaForm {
  numeroParcela: number;
  valor: number;
  dataVencimento: Date;
  isSinal: boolean;
}

const parseDecimalInput = (raw: unknown): number | undefined => {
  if (raw === '' || raw === null || raw === undefined) return undefined;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;
  if (typeof raw !== 'string') return undefined;

  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  // Suporta "5000.00" e "5.000,00".
  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed;

  const num = Number(normalized);
  return Number.isFinite(num) ? num : undefined;
};

const parseIntInput = (raw: unknown): number | undefined => {
  const num = parseDecimalInput(raw);
  if (num === undefined) return undefined;
  const intVal = Math.trunc(num);
  return Number.isFinite(intVal) ? intVal : undefined;
};

const toLocalISOString = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// Schema atualizado com validações mais rigorosas, incluindo interessado e reserva
const schema = z.object({
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
  vincularSala: z.boolean().default(false),
  tipoDeSalaId: z.string().optional(),
  descricaoSala: z.string().optional(),
  // Campos do interessado
  interessadoId: z.number().optional(),
  interessadoNome: z.string().optional(),
  interessadoDocumento: z.string().optional(),
  interessadoTelefone: z.string().optional(),
  interessadoEmail: z.string().optional(),
  // Campos da reserva/contrato
  quantidadeParticipantes: z.preprocess(
    (val) => parseIntInput(val),
    z.number().int().finite().min(1, 'Quantidade deve ser maior que 0').optional()
  ),
  valorTotal: z.preprocess(
    (val) => parseDecimalInput(val),
    z.number().finite().min(0, 'Valor deve ser maior ou igual a 0').optional()
  ),
  valorSinal: z.preprocess(
    (val) => parseDecimalInput(val),
    z.number().finite().min(0, 'Valor deve ser maior ou igual a 0').optional()
  ),
  dataVencimentoSinal: z.date().optional(),
  observacoesReserva: z.string().optional(),
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
  if (data.vincularSala) {
    return data.tipoDeSalaId && data.descricaoSala;
  }
  return true;
}, {
  message: "Tipo de sala e descrição são obrigatórios quando vincular sala",
  path: ["tipoDeSalaId"],
});

type FormData = z.infer<typeof schema>;

interface CreateEventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
}

export const CreateEventoModal: React.FC<CreateEventoModalProps> = ({ isOpen, onClose, initialDate }) => {
  const { toast } = useToast();
  const createEvento = useCreateEvento();
  const createInteressado = useCreateInteressado();
  const { data: tiposEventos, isLoading: loadingTipos } = useTiposEventos();
  const { data: tiposSalas } = useTiposDeSalas();
  const { data: interessados } = useInteressados();

  const [searchInteressado, setSearchInteressado] = useState('');
  const [interessadoSelecionado, setInteressadoSelecionado] = useState<Interessado | null>(null);
  const [showInteressadoSearch, setShowInteressadoSearch] = useState(false);
  const [parcelas, setParcelas] = useState<ParcelaForm[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: '',
      descricao: '',
      dataInicio: initialDate || new Date(),
      dataFim: initialDate || new Date(),
      allDay: false,
      tipoEventoId: '',
      inscricaoAtiva: false,
      nomeFormulario: 'generico',
      nivelCompartilhamento: '0',
      horaInicio: '08:00',
      horaFim: '17:00',
      recorrencia: '0',
      fimRecorrencia: undefined,
      vincularSala: false,
      tipoDeSalaId: '',
      descricaoSala: '',
      interessadoId: undefined,
      interessadoNome: '',
      interessadoDocumento: '',
      interessadoTelefone: '',
      interessadoEmail: '',
      // Campos da reserva
      quantidadeParticipantes: undefined,
      valorTotal: undefined,
      valorSinal: undefined,
      dataVencimentoSinal: undefined,
      observacoesReserva: '',
    }
  });

  const watchAllDay = form.watch('allDay');
  const watchInscricaoAtiva = form.watch('inscricaoAtiva');
  const watchDataInicio = form.watch('dataInicio');
  const watchRecorrencia = form.watch('recorrencia');
  const watchVincularSala = form.watch('vincularSala');
  const watchTipoEventoId = form.watch('tipoEventoId');

  const watchValorTotal = form.watch('valorTotal');
  const watchValorSinal = form.watch('valorSinal');

  // Atualizar parcelas quando valor total ou sinal mudar
  useEffect(() => {
    if (parcelas.length > 0) {
      setParcelas(prev => recalculateParcelasValues(prev, watchValorTotal, watchValorSinal));
    }
  }, [watchValorTotal, watchValorSinal]);

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

  // Auto-preencher data fim quando não for dia inteiro
  useEffect(() => {
    if (!watchAllDay && watchDataInicio) {
      form.setValue('dataFim', watchDataInicio);
    }
  }, [watchAllDay, watchDataInicio, form]);

  // Atualizar form quando data inicial mudar
  useEffect(() => {
    if (initialDate) {
      form.setValue('dataInicio', initialDate);
      form.setValue('dataFim', initialDate);
    }
  }, [initialDate, form]);

  // Limpar dados do interessado quando trocar tipo de evento
  useEffect(() => {
    if (!showInteressadoSection) {
      setInteressadoSelecionado(null);
      setParcelas([]);
      form.setValue('interessadoId', undefined);
      form.setValue('interessadoNome', '');
      form.setValue('interessadoDocumento', '');
      form.setValue('interessadoTelefone', '');
      form.setValue('interessadoEmail', '');
      form.setValue('quantidadeParticipantes', undefined);
      form.setValue('valorTotal', undefined);
      form.setValue('valorSinal', undefined);
      form.setValue('dataVencimentoSinal', undefined);
      form.setValue('observacoesReserva', '');
    }
  }, [showInteressadoSection, form]);

  // Funções para gerenciar parcelas
  const handleAddParcela = () => {
    const nextNumber = parcelas.length + 1;
    const lastParcela = parcelas[parcelas.length - 1];
    const nextDate = lastParcela
      ? new Date(lastParcela.dataVencimento.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 dias
      : new Date();

    const newParcela = {
      numeroParcela: nextNumber,
      valor: 0,
      dataVencimento: nextDate,
      isSinal: false
    };

    setParcelas(recalculateParcelasValues([...parcelas, newParcela], watchValorTotal, watchValorSinal));
  };

  const handleRemoveParcela = (index: number) => {
    const newParcelas = parcelas.filter((_, i) => i !== index);
    // Reordenar números das parcelas
    const reordered = newParcelas.map((p, i) => ({ ...p, numeroParcela: i + 1 }));
    setParcelas(recalculateParcelasValues(reordered, watchValorTotal, watchValorSinal));
  };

  const handleParcelaChange = (index: number, field: keyof ParcelaForm, value: any) => {
    const newParcelas = [...parcelas];
    newParcelas[index] = { ...newParcelas[index], [field]: value };
    setParcelas(newParcelas);
  };

  const handleSelectInteressado = (interessado: Interessado) => {
    setInteressadoSelecionado(interessado);
    setShowInteressadoSearch(false);
    form.setValue('interessadoId', interessado.id);
    form.setValue('interessadoNome', interessado.nome);
    form.setValue('interessadoDocumento', interessado.documento);
    form.setValue('interessadoTelefone', interessado.telefone);
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

  const onSubmit = async (values: FormData) => {
    let dataInicio = values.dataInicio;
    let dataFim = values.dataFim;

    // Aplicar horários se não for dia inteiro
    if (!values.allDay && values.horaInicio && values.horaFim) {
      const [horaI, minutoI] = values.horaInicio.split(':').map(Number);
      const [horaF, minutoF] = values.horaFim.split(':').map(Number);

      dataInicio = new Date(values.dataInicio);
      dataInicio.setHours(horaI, minutoI, 0, 0);

      dataFim = new Date(values.dataFim);
      dataFim.setHours(horaF, minutoF, 0, 0);
    }

    let interessadoId = values.interessadoId;

    // Se tem categoria de contrato e não tem interessado selecionado, criar novo
    if (showInteressadoSection && !interessadoId && values.interessadoNome && values.interessadoDocumento && values.interessadoTelefone && values.interessadoEmail) {
      try {
        const novoInteressado = await createInteressado.mutateAsync({
          nome: values.interessadoNome,
          documento: values.interessadoDocumento.replace(/\D/g, ''),
          telefone: values.interessadoTelefone.replace(/\D/g, ''),
          email: values.interessadoEmail,
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

    const data: CreateEventoRequest = {
      titulo: values.titulo,
      descricao: values.descricao,
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString(),
      allDay: values.allDay,
      tipoEventoId: parseInt(values.tipoEventoId),
      inscricaoAtiva: values.inscricaoAtiva,
      nomeFormulario: values.nomeFormulario && values.nomeFormulario !== 'generico' ? parseInt(values.nomeFormulario) as ENomeFormulario : null,
      nivelCompartilhamento: parseInt(values.nivelCompartilhamento) as ENivelCompartilhamento,
      recorrencia: parseInt(values.recorrencia) as ERecorrencia,
      fimRecorrencia: values.recorrencia !== '0' && values.fimRecorrencia ? values.fimRecorrencia.toISOString() : null,
      novaSala: values.vincularSala ? {
        descricao: values.descricaoSala!,
        tipoDeSalaId: parseInt(values.tipoDeSalaId!),
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        allDay: values.allDay
      } : null,
      interessadoId: showInteressadoSection ? interessadoId : null,
      reserva: showInteressadoSection ? {
        valorTotal: values.valorTotal ?? 0,
        valorSinal: values.valorSinal ?? 0,
        dataVencimentoSinal: values.dataVencimentoSinal ? toLocalISOString(values.dataVencimentoSinal) : null,
        quantidadeParticipantes: values.quantidadeParticipantes ?? 0,
        observacoes: values.observacoesReserva?.trim() ? values.observacoesReserva.trim() : null,
        parcelas:
          parcelas.length > 0
            ? parcelas.map((p) => ({
              id: 0,
              numeroParcela: p.numeroParcela,
              valor: p.valor,
              dataVencimento: toLocalISOString(p.dataVencimento),
              isSinal: p.isSinal,
            }))
            : null,
      } : null,
    };

    try {
      await createEvento.mutateAsync(data) as Evento;
      toast({
        title: 'Evento criado com sucesso!',
        // description: 'Um e-mail de confirmação foi enviado para o interessado.',
      });

      form.reset();
      setInteressadoSelecionado(null);
      setParcelas([]);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar evento.',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    form.reset();
    setInteressadoSelecionado(null);
    setParcelas([]);
    onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-w-[95vw] max-h-[88vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Criar Novo Evento
            {initialDate && (
              <Badge variant="secondary" className="ml-2">
                {format(initialDate, 'dd/MM/yyyy')}
              </Badge>
            )}
          </DialogTitle>
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
            </div>

            {/* Seção do Interessado - Aparece apenas quando tipo de evento tem categoria de contrato */}
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
                      {/* Busca de interessado existente */}
                      <div className="relative">
                        <FormLabel className="mb-2 block">Buscar Contratante Existente</FormLabel>
                        <Popover open={showInteressadoSearch} onOpenChange={setShowInteressadoSearch}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                              type="button"
                            >
                              {interessadoSelecionado ? (
                                <span className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  {interessadoSelecionado.nome}
                                </span>
                              ) : (
                                <span className="text-muted-foreground flex items-center gap-2">
                                  <Search className="h-4 w-4" />
                                  Buscar por nome, documento ou email...
                                </span>
                              )}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Buscar contratante..."
                                value={searchInteressado}
                                onValueChange={setSearchInteressado}
                              />
                              <CommandList>
                                <CommandEmpty>Nenhum Contratante encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {interessadosFiltrados?.map((interessado) => (
                                    <CommandItem
                                      key={interessado.id}
                                      value={interessado.nome}
                                      onSelect={() => handleSelectInteressado(interessado)}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">{interessado.nome}</span>
                                        <span className="text-sm text-muted-foreground">
                                          {interessado.documento} • {interessado.email}
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
                            variant="destructive"
                            size="sm"
                            className="mt-2"
                            onClick={handleClearInteressado}
                          >
                            Limpar e preencher novo
                          </Button>
                        )}
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          {interessadoSelecionado
                            ? 'Dados do contratante selecionado (somente leitura):'
                            : 'Ou preencha os dados de um novo contratante:'}
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
                                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                    {...field}
                                    value={field.value ? formatCpfCnpj(field.value) : ''}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    maxLength={18}
                                    disabled={!!interessadoSelecionado}
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
                                <FormLabel className="flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  Telefone *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="(00) 00000-0000"
                                    {...field}
                                    value={field.value ? formatTelefone(field.value) : ''}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    maxLength={15}
                                    disabled={!!interessadoSelecionado}
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
                                <FormLabel className="flex items-center gap-1">
                                  <Mail className="h-4 w-4" />
                                  E-mail *
                                </FormLabel>
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

                {/* Seção dos Dados da Reserva */}
                <AccordionItem value="reserva" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Dados da Reserva</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="quantidadeParticipantes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Quantidade de Participantes
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="Ex: 100"
                                  {...field}
                                  value={formatIntegerForInput(field.value)}
                                  onChange={(e) => {
                                    const numericValue = e.target.value.replace(/\D/g, '');
                                    field.onChange(numericValue ? parseInt(numericValue, 10) : undefined);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="valorTotal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                Valor Total (R$)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="0,00"
                                  {...field}
                                  value={formatCurrencyForInput(field.value)}
                                  onChange={(e) => {
                                    const numericValue = e.target.value.replace(/\D/g, '');
                                    field.onChange(numericValue ? Number(numericValue) / 100 : undefined);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="valorSinal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor do Sinal (R$)</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="0,00"
                                  {...field}
                                  value={formatCurrencyForInput(field.value)}
                                  onChange={(e) => {
                                    const numericValue = e.target.value.replace(/\D/g, '');
                                    field.onChange(numericValue ? Number(numericValue) / 100 : undefined);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dataVencimentoSinal"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Vencimento do Sinal</FormLabel>
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
                                <PopoverContent className="w-auto p-0 z-50" align="start" side="bottom" sideOffset={4}>
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="observacoesReserva"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações da Reserva</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Observações adicionais sobre a reserva..."
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Seção de Parcelas */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <FormLabel className="text-base">Parcelas</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddParcela}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar Parcela
                          </Button>
                        </div>

                        {parcelas.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Nenhuma parcela adicionada. Clique em "Adicionar Parcela" para incluir.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {parcelas.map((parcela, index) => (
                              <div key={index} className="flex items-end gap-2 p-3 bg-muted/50 rounded-lg">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                  <div>
                                    <FormLabel className="text-xs">Parcela</FormLabel>
                                    <Input
                                      value={parcela.numeroParcela}
                                      disabled
                                      className="h-9"
                                    />
                                  </div>
                                  <div>
                                    <FormLabel className="text-xs">Valor (R$)</FormLabel>
                                    <Input
                                      type="text"
                                      value={formatCurrencyForInput(parcela.valor)}
                                      onChange={(e) => {
                                        const numericValue = e.target.value.replace(/\D/g, '');
                                        const newValue = numericValue ? Number(numericValue) / 100 : 0;
                                        handleParcelaChange(index, 'valor', newValue);
                                      }}
                                      placeholder="0,00"
                                      className="h-9"
                                    />
                                  </div>
                                  <div>
                                    <FormLabel className="text-xs">Vencimento</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full h-9 pl-3 text-left font-normal",
                                            !parcela.dataVencimento && "text-muted-foreground"
                                          )}
                                        >
                                          {parcela.dataVencimento ? (
                                            format(parcela.dataVencimento, "dd/MM/yyyy")
                                          ) : (
                                            <span>Selecione</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0 z-50" align="start" side="bottom" sideOffset={4}>
                                        <Calendar
                                          mode="single"
                                          selected={parcela.dataVencimento}
                                          onSelect={(date) => handleParcelaChange(index, 'dataVencimento', date || new Date())}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <Switch
                                        checked={parcela.isSinal}
                                        onCheckedChange={(checked) => handleParcelaChange(index, 'isSinal', checked)}
                                      />
                                      <span className="text-xs">Sinal</span>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveParcela(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
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
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined;
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
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
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined;
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchRecorrencia !== '0' && (
                <FormField
                  control={form.control}
                  name="fimRecorrencia"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fim da Recorrência *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined;
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="vincularSala"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Vincular Sala</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Reservar uma sala para este evento
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

            {watchVincularSala && (
              <div className="p-4 bg-green-50 rounded-lg space-y-4">
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
                                {tipo.nome} - Capacidade: {tipo.capacidade}
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
                  name="descricaoSala"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição da Reserva *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Reunião do grupo..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

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
                disabled={createEvento.isPending || createInteressado.isPending}
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {(createEvento.isPending || createInteressado.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {createInteressado.isPending ? 'Salvando contratante...' : 'Criando...'}
                  </>
                ) : (
                  showInteressadoSection ? 'Criar Reserva' : 'Criar Evento'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
