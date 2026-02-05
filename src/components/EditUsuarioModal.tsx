import React, { useState, useEffect } from 'react';
import { Loader, User, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Usuario } from '@/hooks/api/useUsuarios';
import { useUpdateUsuario } from '@/hooks/api/useUsuarios';
import { toast } from 'sonner';

interface EditUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
}

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
  { id: 'SalaAprovar', label: 'Aprovar Salas', category: 'Salas' },

  // Tipos de Salas
  { id: 'TipoSalaLer', label: 'Visualizar Tipos de Salas', category: 'Tipos de Salas' },
  { id: 'TipoSalaCriar', label: 'Criar Tipos de Salas', category: 'Tipos de Salas' },
  { id: 'TipoSalaEditar', label: 'Editar Tipos de Salas', category: 'Tipos de Salas' },
  { id: 'TipoSalaExcluir', label: 'Excluir Tipos de Salas', category: 'Tipos de Salas' },

  // // Contratantes
  // { id: 'ContratanteLer', label: 'Visualizar Contratantes', category: 'Contratantes' },
  // { id: 'ContratanteCriar', label: 'Criar Contratantes', category: 'Contratantes' },
  // { id: 'ContratanteEditar', label: 'Editar Contratantes', category: 'Contratantes' },
  // { id: 'ContratanteExcluir', label: 'Excluir Contratantes', category: 'Contratantes' },

  // // Reservas
  // { id: 'ReservaLer', label: 'Visualizar Reservas', category: 'Reservas' },
  // { id: 'ReservaCriar', label: 'Criar Reservas', category: 'Reservas' },
  // { id: 'ReservaEditar', label: 'Editar Reservas', category: 'Reservas' },
  // { id: 'ReservaExcluir', label: 'Excluir Reservas', category: 'Reservas' },
];

// Agrupar claims por categoria
const CLAIMS_BY_CATEGORY = AVAILABLE_CLAIMS.reduce((acc, claim) => {
  if (!acc[claim.category]) {
    acc[claim.category] = [];
  }
  acc[claim.category].push(claim);
  return acc;
}, {} as Record<string, typeof AVAILABLE_CLAIMS>);

export const EditUsuarioModal: React.FC<EditUsuarioModalProps> = ({ isOpen, onClose, usuario }) => {
  const [nome, setNome] = useState('');
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);

  const updateUsuario = useUpdateUsuario();

  // Preenche os dados ao abrir o modal
  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome);
      // Filtra apenas os acessos do módulo Calendario
      const calendarioClaims = usuario.acessos
        .filter(a => a.modulo === 'Calendario')
        .map(a => a.acesso);
      setSelectedClaims(calendarioClaims);
    }
  }, [usuario]);

  const handleClaimToggle = (claim: string) => {
    setSelectedClaims(prev =>
      prev.includes(claim)
        ? prev.filter(c => c !== claim)
        : [...prev, claim]
    );
  };

  const handleSelectAll = () => {
    const allClaims = AVAILABLE_CLAIMS.map(c => c.id);
    setSelectedClaims(allClaims);
  };

  const handleDeselectAll = () => {
    setSelectedClaims([]);
  };

  const handleSubmit = async () => {
    if (!usuario) return;

    try {
      await updateUsuario.mutateAsync({
        email: usuario.email,
        nome,
        acessos: selectedClaims.map(claim => ({
          modulo: 'Calendario',
          acesso: claim
        }))
      });
      toast.success('Usuário atualizado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    }
  };

  const handleClose = () => {
    setNome('');
    setSelectedClaims([]);
    onClose();
  };

  if (!usuario) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={usuario.email}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do usuário"
            />
          </div>

          <Separator />

          {/* Permissões */}
          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <Label>Permissões do Calendário</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Selecionar Tudo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  Limpar
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 border rounded-md p-2">
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
                              checked={selectedClaims.includes(claim.id)}
                              onCheckedChange={() => handleClaimToggle(claim.id)}
                              className="mt-0.5 flex-shrink-0"
                            />
                            <div className="grid gap-0.5 leading-none">
                              <label
                                htmlFor={claim.id}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {claim.label}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {claim.category}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateUsuario.isPending || !nome.trim()}
          >
            {updateUsuario.isPending ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
