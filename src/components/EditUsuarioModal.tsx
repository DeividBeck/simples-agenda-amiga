import React, { useState, useEffect } from 'react';
import { Loader, User, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Usuario } from '@/hooks/api/useUsuarios';
import { useUpdateUsuario } from '@/hooks/api/useUsuarios';
import { toast } from 'sonner';

interface EditUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
}

// Claims disponíveis do módulo Calendario
const CALENDARIO_CLAIMS = [
  { value: 'Admin', label: 'Administrador', description: 'Acesso total ao sistema' },
  { value: 'EventoCriar', label: 'Criar Eventos', description: 'Pode criar novos eventos' },
  { value: 'EventoLer', label: 'Ver Eventos', description: 'Pode visualizar eventos' },
  { value: 'EventoEditar', label: 'Editar Eventos', description: 'Pode editar eventos existentes' },
  { value: 'EventoExcluir', label: 'Excluir Eventos', description: 'Pode excluir eventos' },
  { value: 'TipoEventoCriar', label: 'Criar Tipos de Evento', description: 'Pode criar tipos de evento' },
  { value: 'TipoEventoLer', label: 'Ver Tipos de Evento', description: 'Pode visualizar tipos de evento' },
  { value: 'TipoEventoEditar', label: 'Editar Tipos de Evento', description: 'Pode editar tipos de evento' },
  { value: 'TipoEventoExcluir', label: 'Excluir Tipos de Evento', description: 'Pode excluir tipos de evento' },
  { value: 'SalaCriar', label: 'Criar Reservas de Sala', description: 'Pode criar reservas de sala' },
  { value: 'SalaLer', label: 'Ver Reservas de Sala', description: 'Pode visualizar reservas de sala' },
  { value: 'SalaEditar', label: 'Editar Reservas de Sala', description: 'Pode editar reservas de sala' },
  { value: 'SalaExcluir', label: 'Excluir Reservas de Sala', description: 'Pode excluir reservas de sala' },
  { value: 'TipoSalaCriar', label: 'Criar Tipos de Sala', description: 'Pode criar tipos de sala' },
  { value: 'TipoSalaLer', label: 'Ver Tipos de Sala', description: 'Pode visualizar tipos de sala' },
  { value: 'TipoSalaEditar', label: 'Editar Tipos de Sala', description: 'Pode editar tipos de sala' },
  { value: 'TipoSalaExcluir', label: 'Excluir Tipos de Sala', description: 'Pode excluir tipos de sala' },
  { value: 'ReservaLer', label: 'Ver Reservas', description: 'Pode visualizar reservas' },
  { value: 'ReservaEditar', label: 'Editar Reservas', description: 'Pode editar reservas' },
  { value: 'InteressadoCriar', label: 'Criar Contratantes', description: 'Pode criar contratantes' },
  { value: 'InteressadoLer', label: 'Ver Contratantes', description: 'Pode visualizar contratantes' },
  { value: 'InteressadoEditar', label: 'Editar Contratantes', description: 'Pode editar contratantes' },
  { value: 'InteressadoExcluir', label: 'Excluir Contratantes', description: 'Pode excluir contratantes' },
  { value: 'InscricaoLer', label: 'Ver Inscrições', description: 'Pode visualizar inscrições' },
  { value: 'InscricaoExcluir', label: 'Excluir Inscrições', description: 'Pode excluir inscrições' },
];

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
    const allClaims = CALENDARIO_CLAIMS.map(c => c.value);
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
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
          <div className="space-y-2 flex-1 overflow-hidden">
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
            
            <ScrollArea className="h-[300px] border rounded-md p-3">
              <div className="space-y-3">
                {CALENDARIO_CLAIMS.map((claim) => (
                  <div 
                    key={claim.value} 
                    className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={claim.value}
                      checked={selectedClaims.includes(claim.value)}
                      onCheckedChange={() => handleClaimToggle(claim.value)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={claim.value}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {claim.label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {claim.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
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
