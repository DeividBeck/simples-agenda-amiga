import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Pencil, Loader2, Users } from 'lucide-react';
import { useListarUsuarios, Usuario } from '@/hooks/api/useUsers';
import { EditUsuarioModal } from './EditUsuarioModal';

interface GerenciarUsuariosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mapeamento de claims para labels legíveis
const CLAIM_LABELS: Record<string, string> = {
  'EventoLer': 'Ler Eventos',
  'EventoCriar': 'Criar Eventos',
  'EventoEditar': 'Editar Eventos',
  'EventoExcluir': 'Excluir Eventos',
  'TipoEventoLer': 'Ler Tipos de Evento',
  'TipoEventoCriar': 'Criar Tipos de Evento',
  'TipoEventoEditar': 'Editar Tipos de Evento',
  'TipoEventoExcluir': 'Excluir Tipos de Evento',
  'SalaLer': 'Ler Salas',
  'SalaCriar': 'Criar Salas',
  'SalaEditar': 'Editar Salas',
  'SalaExcluir': 'Excluir Salas',
  'TipoSalaLer': 'Ler Tipos de Sala',
  'TipoSalaCriar': 'Criar Tipos de Sala',
  'TipoSalaEditar': 'Editar Tipos de Sala',
  'TipoSalaExcluir': 'Excluir Tipos de Sala',
  'ListarUsuario': 'Listar Usuários',
};

export const GerenciarUsuariosModal = ({ isOpen, onClose }: GerenciarUsuariosModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  
  const { data: usuarios, isLoading, error } = useListarUsuarios();

  // Filtrar usuários baseado na busca
  const filteredUsuarios = useMemo(() => {
    if (!usuarios) return [];
    if (!searchTerm.trim()) return usuarios;
    
    const term = searchTerm.toLowerCase();
    return usuarios.filter(
      usuario =>
        usuario.nome.toLowerCase().includes(term) ||
        usuario.email.toLowerCase().includes(term)
    );
  }, [usuarios, searchTerm]);

  // Extrair permissões do Calendário
  const getCalendarioPermissions = (usuario: Usuario): string[] => {
    return usuario.acessos
      .filter(acesso => acesso.modulo === 'Calendario')
      .map(acesso => acesso.acesso);
  };

  // Gerar resumo das permissões
  const getPermissionsSummary = (usuario: Usuario): string => {
    const permissions = getCalendarioPermissions(usuario);
    if (permissions.length === 0) return 'Sem permissões';
    if (permissions.length <= 3) {
      return permissions.map(p => CLAIM_LABELS[p] || p).join(', ');
    }
    return `${permissions.length} permissões`;
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
  };

  const handleCloseEdit = () => {
    setEditingUsuario(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Usuários
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Barra de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tabela de usuários */}
            <div className="flex-1 overflow-auto border rounded-md">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Carregando usuários...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-32 text-destructive">
                  Erro ao carregar usuários. Verifique suas permissões.
                </div>
              ) : filteredUsuarios.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Permissões (Calendário)</TableHead>
                      <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsuarios.map((usuario) => (
                      <TableRow key={usuario.email}>
                        <TableCell className="font-medium">{usuario.nome}</TableCell>
                        <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getCalendarioPermissions(usuario).length === 0 ? (
                              <Badge variant="secondary" className="text-xs">
                                Sem permissões
                              </Badge>
                            ) : getCalendarioPermissions(usuario).length <= 3 ? (
                              getCalendarioPermissions(usuario).map((permission) => (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {CLAIM_LABELS[permission] || permission}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="default" className="text-xs">
                                {getCalendarioPermissions(usuario).length} permissões
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(usuario)}
                            title="Editar usuário"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Contador de resultados */}
            {!isLoading && !error && (
              <div className="text-sm text-muted-foreground">
                {filteredUsuarios.length} usuário(s) encontrado(s)
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de edição */}
      {editingUsuario && (
        <EditUsuarioModal
          isOpen={!!editingUsuario}
          onClose={handleCloseEdit}
          usuario={editingUsuario}
        />
      )}
    </>
  );
};
