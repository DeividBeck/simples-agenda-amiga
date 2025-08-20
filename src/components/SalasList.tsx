
import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle, Users, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useDeleteSala } from '@/hooks/useApi';
import { useClaims } from '@/hooks/useClaims';
import { useToast } from '@/hooks/use-toast';
import { Sala } from '@/types/api';

interface SalasListProps {
  salas: Sala[];
  isLoading: boolean;
  onEditSala: (sala: Sala) => void;
  onViewSala: (sala: Sala) => void;
}

export const SalasList: React.FC<SalasListProps> = ({ salas, isLoading, onEditSala, onViewSala }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dataInicio');
  const { toast } = useToast();
  const { canEditSalas, canDeleteSalas } = useClaims();
  const deleteSala = useDeleteSala();

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Pendente';
      case 1: return 'Aprovado';
      case 2: return 'Rejeitado';
      case 3: return 'Cancelado';
      default: return 'Pendente';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-700';
      case 1: return 'bg-green-100 text-green-700';
      case 2: return 'bg-red-100 text-red-700';
      case 3: return 'bg-gray-100 text-gray-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 0: return AlertCircle;
      case 1: return CheckCircle;
      case 2: return XCircle;
      case 3: return XCircle;
      default: return AlertCircle;
    }
  };

  const handleDeleteSala = async (id: number, descricao: string) => {
    try {
      await deleteSala.mutateAsync(id);
      toast({
        title: 'Sala excluída',
        description: `A reserva "${descricao}" foi excluída com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir sala',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar excluir a reserva. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Filtrar e ordenar salas
  const filteredSalas = salas
    .filter(sala => {
      const matchesSearch = sala.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || sala.status.toString() === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'dataInicio') {
        return new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime();
      }
      if (sortBy === 'descricao') {
        return a.descricao.localeCompare(b.descricao);
      }
      return 0;
    });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar reservas</label>
              <Input
                placeholder="Digite a descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Filtrar por status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="0">Pendente</SelectItem>
                  <SelectItem value="1">Aprovado</SelectItem>
                  <SelectItem value="2">Rejeitado</SelectItem>
                  <SelectItem value="3">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ordenar por</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dataInicio">Data de início</SelectItem>
                  <SelectItem value="descricao">Descrição</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Salas */}
      <div className="grid gap-4">
        {filteredSalas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhuma reserva encontrada</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Ainda não há reservas de salas cadastradas'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSalas.map(sala => {
            const StatusIcon = getStatusIcon(sala.status);
            
            return (
              <Card key={sala.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {sala.tipoDeSala?.nome || 'Sala'}
                        
                        <div className="ml-auto flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewSala(sala)}
                          >
                            Ver Detalhes
                          </Button>
                          
                          {(canEditSalas() || canDeleteSalas()) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEditSalas() && (
                                  <DropdownMenuItem onClick={() => onEditSala(sala)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                )}
                                {canDeleteSalas() && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir esta reserva de sala? 
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteSala(sala.id, sala.descricao)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardTitle>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {sala.allDay ? (
                            format(parseISO(sala.dataInicio), 'dd/MM/yyyy', { locale: ptBR })
                          ) : (
                            `${format(parseISO(sala.dataInicio), 'dd/MM/yyyy HH:mm', { locale: ptBR })} - ${format(parseISO(sala.dataFim), 'HH:mm', { locale: ptBR })}`
                          )}
                        </div>
                        
                        {sala.tipoDeSala?.capacidade && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {sala.tipoDeSala.capacidade} pessoas
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        style={{ 
                          backgroundColor: sala.tipoDeSala?.cor,
                          color: '#fff'
                        }}
                        className="flex items-center gap-1"
                      >
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: '#fff' }}
                        />
                        {sala.tipoDeSala?.nome}
                      </Badge>
                      
                      <Badge 
                        className={`flex items-center gap-1 ${getStatusColor(sala.status)}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {getStatusLabel(sala.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 mb-3">{sala.descricao}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {sala.allDay && (
                      <Badge variant="secondary" className="text-xs">
                        Dia inteiro
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
