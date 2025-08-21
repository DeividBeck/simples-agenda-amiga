import React, { useState, useEffect } from 'react';
import { Wrench, Building, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ColorSelector } from './ColorSelector';
import { useUpdateTipoDeSala } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { TipoDeSala } from '@/types/api';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  capacidade: z.number().min(1, 'Capacidade deve ser maior que 0'),
  cor: z.string().min(1, 'Cor é obrigatória'),
  localizacao: z.string().optional(),
  descricao: z.string().optional(),
  disponivel: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface EditTipoDeSalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoDeSala: TipoDeSala | null;
}

export const EditTipoDeSalaModal: React.FC<EditTipoDeSalaModalProps> = ({ 
  isOpen, 
  onClose, 
  tipoDeSala 
}) => {
  const [equipamentos, setEquipamentos] = useState<string[]>([]);
  const [novoEquipamento, setNovoEquipamento] = useState('');
  const { toast } = useToast();
  const updateTipoDeSala = useUpdateTipoDeSala();

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

  // Preencher formulário quando tipoDeSala mudar
  useEffect(() => {
    if (tipoDeSala) {
      form.reset({
        nome: tipoDeSala.nome,
        capacidade: tipoDeSala.capacidade,
        cor: tipoDeSala.cor,
        localizacao: tipoDeSala.localizacao || '',
        descricao: tipoDeSala.descricao || '',
        disponivel: tipoDeSala.disponivel,
      });
      setEquipamentos(tipoDeSala.equipamentos || []);
    }
  }, [tipoDeSala, form]);

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
    if (!tipoDeSala) return;

    try {
      const updatedData: TipoDeSala = {
        ...tipoDeSala,
        nome: data.nome,
        capacidade: data.capacidade,
        cor: data.cor,
        localizacao: data.localizacao || null,
        descricao: data.descricao || null,
        equipamentosJson: JSON.stringify(equipamentos),
        disponivel: data.disponivel,
        equipamentos,
        dataAtualizacao: new Date().toISOString(),
      };

      await updateTipoDeSala.mutateAsync({ id: tipoDeSala.id, data: updatedData });

      toast({
        title: 'Tipo de sala atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      });

      handleClose();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar atualizar o tipo de sala.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    form.reset();
    setEquipamentos([]);
    setNovoEquipamento('');
    onClose();
  };

  if (!tipoDeSala) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Editar Tipo de Sala
          </DialogTitle>
        </DialogHeader>

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
                onClick={handleClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={updateTipoDeSala.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateTipoDeSala.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};