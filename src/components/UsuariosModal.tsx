import React, { useState } from 'react';
import { Search, Users, Loader, Mail, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useUsuarios, Usuario } from '@/hooks/api/useUsuarios';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UsuariosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsuariosModal: React.FC<UsuariosModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: apiData, isLoading, error } = useUsuarios();

  console.log('Dados de usuários vindos da API:', apiData);

  // Ajuste: Verifica se é um array direto ou se está dentro de .resultado
  const usuarios = Array.isArray(apiData) ? apiData : (apiData as any)?.resultado || [];

  const filteredUsuarios = Array.isArray(usuarios) ? usuarios.filter((u: Usuario) =>
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Agrupa os acessos por módulo para exibição
  const getAcessosPorModulo = (usuario: Usuario) => {
    const agrupados: Record<string, string[]> = {};
    usuario.acessos.forEach(a => {
      if (!agrupados[a.modulo]) {
        agrupados[a.modulo] = [];
      }
      agrupados[a.modulo].push(a.acesso);
    });
    return agrupados;
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl w-[95vw] max-w-[95vw] max-h-[88vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Usuários
              {Array.isArray(usuarios) && (
                <Badge variant="secondary">{usuarios.length}</Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Erro ao carregar usuários
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tente buscar por outro termo' : 'Não há usuários para exibir'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsuarios.map((usuario) => {
                    const acessosPorModulo = getAcessosPorModulo(usuario);
                    return (
                      <TableRow key={usuario.email}>
                        <TableCell className="font-medium">{usuario.nome}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {usuario.email}
                          </span>
                        </TableCell>
                        <TableCell>

                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
