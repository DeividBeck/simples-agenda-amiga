import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCadastroUsuario } from '@/hooks/api/useUsers';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CadastroUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Claims disponíveis do sistema
const AVAILABLE_CLAIMS = [
  // Eventos
  { id: 'EventoLer', label: 'Visualizar Eventos', category: 'Eventos' },
  { id: 'EventoCriar', label: 'Criar Eventos', category: 'Eventos' },
  { id: 'EventoEditar', label: 'Editar Eventos', category: 'Eventos' },
  { id: 'EventoExcluir', label: 'Excluir Eventos', category: 'Eventos' },

  // Tipos de Eventos
  { id: 'TipoEventoLer', label: 'Visualizar Tipos de Eventos', category: 'Tipos de Eventos' },
  { id: 'TipoEventoCriar', label: 'Criar Tipos de Eventos', category: 'Tipos de Eventos' },
  { id: 'TipoEventoEditar', label: 'Editar Tipos de Eventos', category: 'Tipos de Eventos' },
  { id: 'TipoEventoExcluir', label: 'Excluir Tipos de Eventos', category: 'Tipos de Eventos' },

  // Salas
  { id: 'SalaLer', label: 'Visualizar Salas', category: 'Salas' },
  { id: 'SalaCriar', label: 'Criar Salas', category: 'Salas' },
  { id: 'SalaEditar', label: 'Editar Salas', category: 'Salas' },
  { id: 'SalaExcluir', label: 'Excluir Salas', category: 'Salas' },

  // Tipos de Salas
  { id: 'TipoSalaLer', label: 'Visualizar Tipos de Salas', category: 'Tipos de Salas' },
  { id: 'TipoSalaCriar', label: 'Criar Tipos de Salas', category: 'Tipos de Salas' },
  { id: 'TipoSalaEditar', label: 'Editar Tipos de Salas', category: 'Tipos de Salas' },
  { id: 'TipoSalaExcluir', label: 'Excluir Tipos de Salas', category: 'Tipos de Salas' },
];

// Agrupar claims por categoria
const CLAIMS_BY_CATEGORY = AVAILABLE_CLAIMS.reduce((acc, claim) => {
  if (!acc[claim.category]) {
    acc[claim.category] = [];
  }
  acc[claim.category].push(claim);
  return acc;
}, {} as Record<string, typeof AVAILABLE_CLAIMS>);

export const CadastroUsuarioModal: React.FC<CadastroUsuarioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tokenData } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    claims: [] as string[],
  });

  const { mutate: cadastrarUsuario, isPending } = useCadastroUsuario();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.nome) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.claims.length === 0) {
      toast({
        title: 'Erro de validação',
        description: 'Selecione pelo menos uma permissão.',
        variant: 'destructive',
      });
      return;
    }
    const cadastroData = {
      email: formData.email,
      nome: formData.nome,
      empresaId: parseInt(tokenData.EmpresaId),
      claims: formData.claims,
      filiais: []
    }

    cadastrarUsuario(cadastroData, {
      onSuccess: () => {
        toast({
          title: 'Usuário cadastrado',
          description: 'O usuário foi cadastrado com sucesso.',
        });
        handleClose();
      },
      onError: (error) => {
        toast({
          title: 'Erro no cadastro',
          description: error.message || 'Ocorreu um erro ao cadastrar o usuário.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleClose = () => {
    setFormData({
      email: '',
      nome: '',
      claims: [],
    });
    onClose();
  };

  const handleClaimToggle = (claimId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      claims: checked
        ? [...prev.claims, claimId]
        : prev.claims.filter(c => c !== claimId),
    }));
  };

  const handleSelectAll = () => {
    const allClaims = AVAILABLE_CLAIMS.map(claim => claim.id);
    setFormData(prev => ({ ...prev, claims: allClaims }));
  };

  const handleClearAll = () => {
    setFormData(prev => ({ ...prev, claims: [] }));
  };

  const isAdmin = formData.claims.length === AVAILABLE_CLAIMS.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cadastrar Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Cadastre um novo usuário para acessar o sistema. O usuário será vinculado à sua empresa e filial atual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col gap-4 sm:gap-6">
          {/* Dados pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="usuario@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do usuário"
                required
              />
            </div>
          </div>

          {/* Status do usuário */}
          {isAdmin && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-800">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Usuário Administrador</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Este usuário terá acesso total ao sistema com todas as permissões.
              </p>
            </div>
          )}

          {/* Área scrollável com permissões */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div>
                  <Label className="text-base font-medium">Permissões *</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecione as permissões que o usuário terá no sistema
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-xs w-full sm:w-auto"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Selecionar Todas
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-xs w-full sm:w-auto"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpar Seleção
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 pb-4">
                {Object.entries(CLAIMS_BY_CATEGORY).map(([category, claims]) => (
                  <Card key={category} className="h-fit">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 sm:space-y-3">
                        {claims.map((claim) => (
                          <div key={claim.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={claim.id}
                              checked={formData.claims.includes(claim.id)}
                              onCheckedChange={(checked) => handleClaimToggle(claim.id, !!checked)}
                              className="mt-0.5 flex-shrink-0"
                            />
                            <Label
                              htmlFor={claim.id}
                              className="text-sm font-normal leading-snug cursor-pointer flex-1"
                            >
                              {claim.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Botões */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="order-2 sm:order-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !formData.email || !formData.nome || formData.claims.length === 0}
              className="bg-blue-600 hover:bg-blue-700 order-1 sm:order-2"
            >
              {isPending ? 'Cadastrando...' : 'Cadastrar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};