
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFilialData, useUpdateFilial, FilialData } from '@/hooks/api/useFilial';
import { useCepSearch } from '@/hooks/useCepSearch';
import { useToast } from '@/hooks/use-toast';
import { Loader, Building2, Search } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface DadosParoquiaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DadosParoquiaModal: React.FC<DadosParoquiaModalProps> = ({ isOpen, onClose }) => {
  const { data: filialData, isLoading } = useFilialData();
  const updateFilial = useUpdateFilial();
  const { searchCep, isLoading: cepLoading } = useCepSearch();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<FilialData>>({});

  useEffect(() => {
    if (filialData) {
      setFormData(filialData);
    }
  }, [filialData]);

  const handleChange = (field: keyof FilialData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value || null }));
  };

  const handleCepSearch = async () => {
    if (!formData.cep) return;
    const data = await searchCep(formData.cep);
    if (data) {
      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || prev?.endereco,
        bairro: data.bairro || null,
        cidade: data.localidade || prev?.cidade,
        estado: data.uf || prev?.estado,
      }));
      toast({ title: 'CEP encontrado', description: `${data.localidade} - ${data.uf}` });
    } else {
      toast({ title: 'CEP não encontrado', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filialData) return;

    try {
      await updateFilial.mutateAsync({
        ...filialData,
        ...formData,
        // Campos travados mantêm o valor original
        nome: filialData.nome,
        cnpj: filialData.cnpj,
      } as FilialData);

      toast({ title: 'Dados atualizados com sucesso!' });
      onClose();
    } catch (error) {
      toast({ title: 'Erro ao atualizar dados', variant: 'destructive' });
    }
  };

  const formatCnpj = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Dados da Paróquia
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Básicos (travados) */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Identificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Paróquia</Label>
                  <Input value={formData.nome || ''} disabled className="bg-gray-100" />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={formData.cnpj ? formatCnpj(formData.cnpj) : ''} disabled className="bg-gray-100" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contato */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="email@paroquia.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.telefone || ''}
                    onChange={e => handleChange('telefone', e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.cep || ''}
                      onChange={e => handleChange('cep', e.target.value)}
                      placeholder="00000-000"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={handleCepSearch} disabled={cepLoading}>
                      {cepLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={formData.endereco || ''}
                    onChange={e => handleChange('endereco', e.target.value)}
                    placeholder="Rua, Avenida..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.cidade || ''}
                    onChange={e => handleChange('cidade', e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={formData.estado || ''}
                    onChange={e => handleChange('estado', e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Representante Legal */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Representante Legal</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formData.representanteLegal || ''}
                    onChange={e => handleChange('representanteLegal', e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RG</Label>
                  <Input
                    value={formData.rgRepresentante || ''}
                    onChange={e => handleChange('rgRepresentante', e.target.value)}
                    placeholder="RG"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={formData.cpfRepresentante || ''}
                    onChange={e => handleChange('cpfRepresentante', e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Dados Bancários */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Dados Bancários</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Banco</Label>
                  <Input
                    value={formData.banco || ''}
                    onChange={e => handleChange('banco', e.target.value)}
                    placeholder="Nome do banco"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Agência</Label>
                  <Input
                    value={formData.agencia || ''}
                    onChange={e => handleChange('agencia', e.target.value)}
                    placeholder="0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conta Corrente</Label>
                  <Input
                    value={formData.contaCorrente || ''}
                    onChange={e => handleChange('contaCorrente', e.target.value)}
                    placeholder="00000-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chave PIX</Label>
                  <Input
                    value={formData.chavePix || ''}
                    onChange={e => handleChange('chavePix', e.target.value)}
                    placeholder="Chave PIX"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateFilial.isPending}>
                {updateFilial.isPending ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
