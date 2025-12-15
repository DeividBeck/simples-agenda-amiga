import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Save, User, MapPin, Calendar, DollarSign, Users, Loader, Check, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Reserva, ReservaDto, EStatusReservaContrato } from '@/types/api';
import { useUpdateReserva } from '@/hooks/api/useReservas';

interface ReservaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: Reserva | null;
}

const formSchema = z.object({
  valorTotal: z.coerce.number().min(0, 'Valor deve ser maior ou igual a zero').optional().nullable(),
  valorSinal: z.coerce.number().min(0, 'Valor deve ser maior ou igual a zero').optional().nullable(),
  quantidadeParticipantes: z.coerce.number().min(1, 'Quantidade deve ser pelo menos 1').optional().nullable(),
  observacoes: z.string().optional().nullable(),
  nomePadreResponsavel: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

const getStatusInfo = (reserva: Reserva) => {
  if (reserva.dadosPreenchidos) {
    return {
      color: 'bg-green-100 text-green-800 border-green-200',
      label: 'Pronto para Contrato',
      icon: Check,
    };
  }
  if (reserva.status === EStatusReservaContrato.Confirmado) {
    return {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      label: 'Aguardando Dados',
      icon: AlertCircle,
    };
  }
  return {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Pendente Confirmação',
    icon: AlertCircle,
  };
};

export const ReservaDetailsModal: React.FC<ReservaDetailsModalProps> = ({
  isOpen,
  onClose,
  reserva,
}) => {
  const { toast } = useToast();
  const updateReserva = useUpdateReserva();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valorTotal: null,
      valorSinal: null,
      quantidadeParticipantes: null,
      observacoes: '',
      nomePadreResponsavel: '',
    },
  });

  useEffect(() => {
    if (reserva) {
      form.reset({
        valorTotal: reserva.valorTotal || null,
        valorSinal: reserva.valorSinal || null,
        quantidadeParticipantes: reserva.quantidadeParticipantes || null,
        observacoes: reserva.observacoes || '',
        nomePadreResponsavel: reserva.nomePadreResponsavel || '',
      });
    }
  }, [reserva, form]);

  const onSubmit = async (data: FormData) => {
    if (!reserva) return;

    try {
      const dto: ReservaDto = {
        id: reserva.id,
        valorTotal: data.valorTotal,
        valorSinal: data.valorSinal,
        quantidadeParticipantes: data.quantidadeParticipantes,
        observacoes: data.observacoes,
        nomePadreResponsavel: data.nomePadreResponsavel,
      };

      await updateReserva.mutateAsync({ id: reserva.id, data: dto });

      toast({
        title: 'Reserva atualizada',
        description: 'As informações do contrato foram salvas com sucesso.',
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar as informações.',
        variant: 'destructive',
      });
    }
  };

  if (!reserva) return null;

  const statusInfo = getStatusInfo(reserva);
  const StatusIcon = statusInfo.icon;
  const canGenerateContract = reserva.dadosPreenchidos && (form.watch('valorTotal') || 0) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Reserva
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className={statusInfo.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
            {reserva.dataEnvioEmail && (
              <span className="text-xs text-muted-foreground">
                Email enviado em {format(new Date(reserva.dataEnvioEmail), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            )}
          </div>

          {/* Evento Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-lg font-semibold">{reserva.evento?.titulo}</span>
                <Badge variant="outline" className="ml-2">
                  {reserva.evento?.tipoEvento?.nome}
                </Badge>
              </div>
              {reserva.evento?.dataInicio && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(reserva.evento.dataInicio), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {' • '}
                  {format(new Date(reserva.evento.dataInicio), "HH:mm", { locale: ptBR })}
                  {reserva.evento.dataFim && ` - ${format(new Date(reserva.evento.dataFim), "HH:mm", { locale: ptBR })}`}
                </p>
              )}
              {reserva.evento?.descricao && (
                <p className="text-sm">{reserva.evento.descricao}</p>
              )}
            </CardContent>
          </Card>

          {/* Dados do Cliente (Somente Leitura) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados do Cliente
                <Badge variant="outline" className="ml-auto text-xs">Somente leitura</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome / Razão Social</Label>
                  <p className="font-medium">{reserva.interessado?.nome || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">CPF / CNPJ</Label>
                  <p className="font-medium">{reserva.interessado?.documento || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">RG</Label>
                  <p className="font-medium">{reserva.rg || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Inscrição Estadual</Label>
                  <p className="font-medium">{reserva.inscricaoEstadual || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Telefone</Label>
                  <p className="font-medium">{reserva.interessado?.telefone || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{reserva.interessado?.email || 'Não informado'}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Endereço
                </Label>
                {reserva.interessado?.rua ? (
                  <p className="font-medium">
                    {reserva.interessado.rua}, {reserva.interessado.numero}
                    {reserva.interessado.bairro && ` - ${reserva.interessado.bairro}`}
                    <br />
                    {reserva.interessado.cidade}/{reserva.interessado.estado}
                    {reserva.interessado.cep && ` - CEP: ${reserva.interessado.cep}`}
                  </p>
                ) : (
                  <p className="text-muted-foreground">Endereço não informado</p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome do Padre Responsável</Label>
                  <p className="font-medium">{reserva.nomePadreResponsavel || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Documento do Padre</Label>
                  <p className="font-medium">{reserva.documentoPadre || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Contrato (Editável pelo Admin) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Dados do Contrato
                <Badge variant="secondary" className="ml-auto text-xs">Editável</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="valorTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              {...field}
                              value={field.value ?? ''}
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
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantidadeParticipantes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Participantes
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nomePadreResponsavel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Padre (Correção pelo Admin)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do padre responsável"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Observações adicionais sobre a reserva..."
                            className="min-h-[80px]"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between pt-4">
                    <Button
                      type="submit"
                      disabled={updateReserva.isPending}
                    >
                      {updateReserva.isPending ? (
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar Informações
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canGenerateContract}
                      title={
                        !canGenerateContract
                          ? 'É necessário que os dados estejam preenchidos e o valor total seja maior que zero'
                          : 'Gerar contrato PDF'
                      }
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Contrato
                    </Button>
                  </div>

                  {!canGenerateContract && (
                    <p className="text-xs text-muted-foreground">
                      Para gerar o contrato, os dados devem estar preenchidos pelo cliente e o valor total deve ser definido.
                    </p>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
