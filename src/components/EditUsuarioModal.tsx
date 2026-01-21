import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save, UserCog } from 'lucide-react';
import { useAtualizarUsuario, Usuario, Acesso } from '@/hooks/api/useUsers';
import { useToast } from '@/hooks/use-toast';

interface EditUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario;
}

// Claims disponíveis do módulo Calendário
const AVAILABLE_CLAIMS = [
  { value: 'EventoLer', label: 'Ler Eventos', category: 'Eventos' },
  { value: 'EventoCriar', label: 'Criar Eventos', category: 'Eventos' },
  { value: 'EventoEditar', label: 'Editar Eventos', category: 'Eventos' },
  { value: 'EventoExcluir', label: 'Excluir Eventos', category: 'Eventos' },
  { value: 'TipoEventoLer', label: 'Ler Tipos de Evento', category: 'Tipos de Eventos' },
  { value: 'TipoEventoCriar', label: 'Criar Tipos de Evento', category: 'Tipos de Eventos' },
  { value: 'TipoEventoEditar', label: 'Editar Tipos de Evento', category: 'Tipos de Eventos' },
  { value: 'TipoEventoExcluir', label: 'Excluir Tipos de Evento', category: 'Tipos de Eventos' },
  { value: 'SalaLer', label: 'Ler Salas', category: 'Salas' },
  { value: 'SalaCriar', label: 'Criar Salas', category: 'Salas' },
  { value: 'SalaEditar', label: 'Editar Salas', category: 'Salas' },
  { value: 'SalaExcluir', label: 'Excluir Salas', category: 'Salas' },
  { value: 'TipoSalaLer', label: 'Ler Tipos de Sala', category: 'Tipos de Salas' },
  { value: 'TipoSalaCriar', label: 'Criar Tipos de Sala', category: 'Tipos de Salas' },
  { value: 'TipoSalaEditar', label: 'Editar Tipos de Sala', category: 'Tipos de Salas' },
  { value: 'TipoSalaExcluir', label: 'Excluir Tipos de Sala', category: 'Tipos de Salas' },
  { value: 'ListarUsuario', label: 'Listar Usuários', category: 'Usuários' },
];

// Agrupar claims por categoria
const CLAIMS_BY_CATEGORY = AVAILABLE_CLAIMS.reduce((acc, claim) => {
  if (!acc[claim.category]) {
    acc[claim.category] = [];
  }
  acc[claim.category].push(claim);
  return acc;
}, {} as Record<string, typeof AVAILABLE_CLAIMS>);

export const EditUsuarioModal = ({ isOpen, onClose, usuario }: EditUsuarioModalProps) => {
  const [nome, setNome] = useState(usuario.nome);
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  
  const { mutateAsync: atualizarUsuario, isPending } = useAtualizarUsuario();
  const { toast } = useToast();

  // Extrair claims do Calendário do usuário ao abrir o modal
  useEffect(() => {
    const calendarioClaims = usuario.acessos
      .filter(acesso => acesso.modulo === 'Calendario')
      .map(acesso => acesso.acesso);
    setSelectedClaims(calendarioClaims);
    setNome(usuario.nome);
  }, [usuario]);

  const handleClaimToggle = (claimValue: string) => {
    setSelectedClaims(prev =>
      prev.includes(claimValue)
        ? prev.filter(c => c !== claimValue)
        : [...prev, claimValue]
    );
  };

  const handleSelectAll = () => {
    setSelectedClaims(AVAILABLE_CLAIMS.map(c => c.value));
  };

  const handleClearAll = () => {
    setSelectedClaims([]);
  };

  const handleSubmit = async () => {
    if (!nome.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Manter outros acessos que não são do Calendário
      const outrosAcessos = usuario.acessos.filter(
        acesso => acesso.modulo !== 'Calendario'
      );

      // Adicionar os novos claims do Calendário
      const novosAcessosCalendario: Acesso[] = selectedClaims.map(claim => ({
        modulo: 'Calendario',
        acesso: claim,
      }));

      const acessosAtualizados = [...outrosAcessos, ...novosAcessosCalendario];

      await atualizarUsuario({
        email: usuario.email,
        nome: nome.trim(),
        acessos: acessosAtualizados,
      });

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso!',
      });

      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar usuário.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Email (somente leitura) */}
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
                  Selecionar todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                >
                  Limpar
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-4">
              <div className="space-y-6">
                {Object.entries(CLAIMS_BY_CATEGORY).map(([category, claims]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      {category}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {claims.map((claim) => (
                        <div key={claim.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-${claim.value}`}
                            checked={selectedClaims.includes(claim.value)}
                            onCheckedChange={() => handleClaimToggle(claim.value)}
                          />
                          <label
                            htmlFor={`edit-${claim.value}`}
                            className="text-sm cursor-pointer"
                          >
                            {claim.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="text-sm text-muted-foreground">
              {selectedClaims.length} permissão(ões) selecionada(s)
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
