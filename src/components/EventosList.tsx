
import React, { useState } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Tag, Users, ExternalLink, Globe, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useDeleteEvento } from '@/hooks/useApi';
import { useClaims } from '@/hooks/useClaims';
import { useToast } from '@/hooks/use-toast';
import { Evento, ENivelCompartilhamento, ENomeFormulario } from '@/types/api';

interface EventosListProps {
  eventos: Evento[];
  isLoading: boolean;
  onEditEvento: (evento: Evento) => void;
}

export const EventosList: React.FC<EventosListProps> = ({ eventos, isLoading, onEditEvento }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dataInicio');
  const { toast } = useToast();
  const { canDeleteEventos } = useClaims();
  const deleteEvento = useDeleteEvento();

  const getNivelCompartilhamentoLabel = (nivel: ENivelCompartilhamento) => {
    switch (nivel) {
      case ENivelCompartilhamento.Local:
        return 'Local';
      case ENivelCompartilhamento.EntreParoquias:
        return 'Entre Paróquias';
      case ENivelCompartilhamento.Diocese:
        return 'Diocese';
      default:
        return 'Local';
    }
  };

  const getNivelCompartilhamentoColor = (nivel: ENivelCompartilhamento) => {
    switch (nivel) {
      case ENivelCompartilhamento.Local:
        return 'bg-gray-100 text-gray-700';
      case ENivelCompartilhamento.EntreParoquias:
        return 'bg-blue-100 text-blue-700';
      case ENivelCompartilhamento.Diocese:
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getNomeFormularioLabel = (formulario: ENomeFormulario) => {
    switch (formulario) {
      case ENomeFormulario.PreparacaoBatismo:
        return 'Preparação para Batismo';
      case ENomeFormulario.PreparacaoMatrimonio:
        return 'Preparação para Matrimônio';
      case ENomeFormulario.Catequese:
        return 'Catequese';
      default:
        return 'Formulário Genérico';
    }
  };

  const generateInscricaoLink = (evento: Evento) => {
    if (evento.slug && evento.filialId) {
      return `/inscricao/${evento.filialId}/${evento.slug}`;
    }
    return `/inscricao/${evento.id}`;
  };

  const handleDeleteEvento = async (id: number, titulo: string) => {
    try {
      await deleteEvento.mutateAsync({ id });
      toast({
        title: 'Evento excluído',
        description: `O evento "${titulo}" foi excluído com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir evento',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar excluir o evento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Filtrar e ordenar eventos
  const filteredEventos = eventos
    .filter(evento => {
      const matchesSearch = evento.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evento.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTipo = filterTipo === 'all' || 
        evento.tipoEventoId?.toString() === filterTipo ||
        evento.tipoEvento?.id?.toString() === filterTipo;
      return matchesSearch && matchesTipo;
    })
    .sort((a, b) => {
      if (sortBy === 'dataInicio') {
        return new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime();
      }
      if (sortBy === 'titulo') {
        return a.titulo.localeCompare(b.titulo);
      }
      return 0;
    });

  // Obter tipos únicos para o filtro
  const tiposUnicos = Array.from(new Set(eventos.map(e => e.tipoEvento)))
    .filter(t => !!t)
    .filter((tipo, index, self) => self.findIndex(t => t.id === tipo.id) === index);

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
              <label className="text-sm font-medium mb-2 block">Buscar eventos</label>
              <Input
                placeholder="Digite o título ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Filtrar por tipo</label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {tiposUnicos.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="titulo">Título</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Eventos */}
      <div className="grid gap-4">
        {filteredEventos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum evento encontrado</h3>
              <p className="text-gray-500">
                {searchTerm || filterTipo !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Ainda não há eventos cadastrados'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEventos.map(evento => {
            const startDate = parseISO(evento.dataInicio);
            const endDate = parseISO(evento.dataFim);
            const isMultiDay = !isSameDay(startDate, endDate);

            return (
              <Card key={evento.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 flex items-center gap-2">
                        {evento.titulo}
                        <div className="ml-auto flex items-center gap-2">
                          {evento.inscricaoAtiva && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 text-xs"
                              onClick={() => window.open(generateInscricaoLink(evento), '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                              Inscrever-se
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditEvento(evento)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {canDeleteEventos() && (
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
                                        Tem certeza que deseja excluir o evento "{evento.titulo}"?
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteEvento(evento.id, evento.titulo)}
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
                        </div>
                      </CardTitle>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {isMultiDay ? (
                            <span>
                              {format(startDate, 'dd/MM/yyyy', { locale: ptBR })} - {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          ) : (
                            format(startDate, 'dd/MM/yyyy', { locale: ptBR })
                          )}
                        </div>

                        {!evento.allDay && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(startDate, 'HH:mm', { locale: ptBR })} - {format(endDate, 'HH:mm', { locale: ptBR })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        style={{
                          backgroundColor: evento.tipoEvento.cor,
                          color: '#fff'
                        }}
                        className="flex items-center gap-1"
                      >
                        <Tag className="h-3 w-3" />
                        {evento.tipoEvento.nome}
                      </Badge>

                      <Badge
                        className={`flex items-center gap-1 ${getNivelCompartilhamentoColor(evento.nivelCompartilhamento)}`}
                      >
                        <Globe className="h-3 w-3" />
                        {getNivelCompartilhamentoLabel(evento.nivelCompartilhamento)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-700 mb-3">{evento.descricao}</p>

                  <div className="flex flex-wrap gap-2">
                    {evento.allDay && (
                      <Badge variant="secondary" className="text-xs">
                        Dia inteiro
                      </Badge>
                    )}

                    {evento.inscricaoAtiva && (
                      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                        <Users className="h-3 w-3" />
                        Inscrições abertas
                        {evento.nomeFormulario !== null && (
                          <span>- {getNomeFormularioLabel(evento.nomeFormulario)}</span>
                        )}
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
