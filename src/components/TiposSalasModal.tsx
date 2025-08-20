
import React, { useState } from 'react';
import { Plus, MapPin, Wrench, Building, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ColorSelector } from './ColorSelector';
import { useTiposDeSalas, useCreateTipoDeSala } from '@/hooks/useApi';
import { useClaims } from '@/hooks/useClaims';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  capacidade: z.number().min(1, 'Capacidade deve ser maior que 0'),
  cor: z.string().min(1, 'Cor é obrigatória'),
  localizacao: z.string().optional(),
  descricao: z.string().optional(),
  disponivel: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface TiposSalasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TiposSalasModal: React.FC<TiposSalasModalProps> = ({ isOpen, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [equipamentos, setEquipamentos] = useState<string[]>([]);
  const [novoEquipamento, setNovoEquipamento] = useState('');
  const { toast } = useToast();
  const { canReadTiposSalas, canCreateTiposSalas } = useClaims();
  const { data: tiposDeSalas, isLoading } = useTiposDeSalas();
  const createTipoDeSala = useCreateTipoDeSala();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      capacidade: 1,
      cor: '#22c55e',
      localizacao: '',
      descricao: '',
      disponivel: true,
    },
  });

  const adicionarEquipamento = () => {
    if (novoEquipamento.trim() && !equipamentos.includes(novoEquipamento.trim())) {
      setEquipamentos([...equipamentos, novoEquipamento.trim()]);
      setNovoEquipamento('');
    }
  };

  const removerEquipamento = (equipamento: string) => {
    setEquipamentos(equipamentos.filter(eq => eq !== equipamento));
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createTipoDeSala.mutateAsync({
        nome: data.nome,
        capacidade: data.capacidade,
        cor: data.cor,
        localizacao: data.localizacao || null,
        descricao: data.descricao || null,
        equipamentosJson: JSON.stringify(equipamentos),
        disponivel: data.disponivel,
        equipamentos,
      });

      toast({
        title: 'Tipo de sala criado!',
        description: 'O novo tipo de sala foi adicionado com sucesso.',
      });

      form.reset();
      setEquipamentos([]);
      setShowForm(false);
    } catch (error) {
      toast({
        title: 'Erro ao criar tipo',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar criar o tipo de sala.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setShowForm(false);
    form.reset();
    setEquipamentos([]);
    onClose();
  };

  const handleCreateClick = () => {
    if (!canCreateTiposSalas()) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para criar tipos de salas.",
        variant: "destructive",
      });
      return;
    }
    setShowForm(!showForm);
  };

  // Se não pode ler tipos de salas, mostrar mensagem de acesso negado
  if (!canReadTiposSalas()) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Tipos de Salas
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Acesso Restrito</h3>
              <p className="text-gray-500">Você não tem permissão para visualizar tipos de salas.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Tipos de Salas
            </div>
            {canCreateTiposSalas() ? (
              <Button 
                onClick={handleCreateClick}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Sala
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
          {showForm && canCreateTiposSalas() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5" />
                  Criar Novo Tipo de Sala
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Sala</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Salão Principal, Sala de Reuniões..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="capacidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacidade</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="localizacao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Localização (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Primeiro andar, Ala Norte..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="disponivel"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Disponível</FormLabel>
                              <div className="text-sm text-gray-500">
                                A sala está disponível para uso
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
                    </div>

                    <FormField
                      control={form.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição (opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descrição da sala, características especiais..."
                              {...field}
                            />
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
                          label="Cor da Sala"
                        />
                      )}
                    />

                    {/* Equipamentos */}
                    <div className="space-y-3">
                      <FormLabel>Equipamentos</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          value={novoEquipamento}
                          onChange={(e) => setNovoEquipamento(e.target.value)}
                          placeholder="Ex: Projetor, Som, Ar condicionado..."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarEquipamento())}
                        />
                        <Button
                          type="button"
                          onClick={adicionarEquipamento}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {equipamentos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {equipamentos.map((equipamento, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="cursor-pointer hover:bg-red-100"
                              onClick={() => removerEquipamento(equipamento)}
                            >
                              <Wrench className="h-3 w-3 mr-1" />
                              {equipamento}
                              <span className="ml-1 text-red-500">×</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

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
                        disabled={createTipoDeSala.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {createTipoDeSala.isPending ? 'Criando...' : 'Criar Sala'}
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
              <MapPin className="h-5 w-5" />
              Salas Existentes ({tiposDeSalas?.length || 0})
            </h3>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tiposDeSalas?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhuma sala cadastrada</h3>
                  <p className="text-gray-500">Crie a primeira sala para começar a organizar os espaços.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tiposDeSalas?.map(sala => (
                  <Card key={sala.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: sala.cor }}
                        />
                        <h4 className="font-semibold text-gray-800">{sala.nome}</h4>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <span>👥 Capacidade: {sala.capacidade}</span>
                        </div>
                        {sala.localizacao && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>{sala.localizacao}</span>
                          </div>
                        )}
                        {sala.descricao && (
                          <p className="text-xs">{sala.descricao}</p>
                        )}
                      </div>

                      {sala.equipamentos && sala.equipamentos.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700">Equipamentos:</p>
                          <div className="flex flex-wrap gap-1">
                            {sala.equipamentos.map((equipamento, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Wrench className="h-2 w-2 mr-1" />
                                {equipamento}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-4">
                        <Badge 
                          variant={sala.disponivel ? "default" : "secondary"}
                          className={sala.disponivel ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                        >
                          {sala.disponivel ? 'Disponível' : 'Indisponível'}
                        </Badge>
                        <Badge 
                          style={{ 
                            backgroundColor: sala.cor + '20',
                            color: sala.cor,
                            border: `1px solid ${sala.cor}40`
                          }}
                        >
                          ID: {sala.id}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
