
import React, { useState } from 'react';
import { Calendar, MapPin, Users, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Evento } from '@/types/api';

// Hook específico para eventos públicos sem autenticação
const useEventosPublicos = (filial: number) => {
  return useQuery({
    queryKey: ['eventosPublicos', filial],
    queryFn: async () => {
      const response = await fetch(`{https://api.ecclesia.app.br/agendaparoquial}/${filial}/Eventos/Publicos`);
      if (!response.ok) {
        throw new Error('Erro ao carregar eventos públicos');
      }
      return response.json() as Promise<Evento[]>;
    },
  });
};

const EventosPublicos = () => {
  const [filialSelecionada, setFilialSelecionada] = useState(0);
  const { data: eventos, isLoading, error } = useEventosPublicos(filialSelecionada);

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNivelCompartilhamentoText = (nivel: number) => {
    switch (nivel) {
      case 1: return 'Entre Paróquias';
      case 2: return 'Diocese';
      default: return 'Público';
    }
  };

  const getNivelCompartilhamentoColor = (nivel: number) => {
    switch (nivel) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-purple-100 text-purple-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Eventos Paroquiais</h1>
                <p className="text-sm text-gray-600">Calendário público de eventos</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Filial:</label>
                <Select value={filialSelecionada.toString()} onValueChange={(value) => setFilialSelecionada(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Principal</SelectItem>
                    <SelectItem value="1">Filial 1</SelectItem>
                    <SelectItem value="2">Filial 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <a href="https://ecclesia.app.br/Acesso/login" target="_blank" rel="noopener noreferrer">
                  Fazer Login
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/70 backdrop-blur-sm border-white/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Eventos</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {isLoading ? '...' : (eventos?.length || 0)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Com Inscrição</p>
                  <p className="text-2xl font-bold text-green-600">
                    {isLoading ? '...' : eventos?.filter(e => e.inscricaoAtiva)?.length || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Este Mês</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {isLoading ? '...' : eventos?.filter(e => {
                      const eventoDate = new Date(e.dataInicio);
                      const now = new Date();
                      return eventoDate.getMonth() === now.getMonth() && eventoDate.getFullYear() === now.getFullYear();
                    })?.length || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Eventos */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando eventos...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-red-600">Erro ao carregar eventos públicos</p>
              </div>
            )}

            {!isLoading && !error && eventos && eventos.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Nenhum evento público encontrado</p>
              </div>
            )}

            {!isLoading && !error && eventos && eventos.length > 0 && (
              <div className="space-y-4">
                {eventos.map((evento) => (
                  <div
                    key={evento.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-800">{evento.titulo}</h3>
                          <Badge
                            className={getNivelCompartilhamentoColor(evento.nivelCompartilhamento)}
                          >
                            {getNivelCompartilhamentoText(evento.nivelCompartilhamento)}
                          </Badge>
                          {evento.inscricaoAtiva && evento.slug && (
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              <Users className="h-3 w-3 mr-1" />
                              Inscrições Abertas
                            </Badge>
                          )}
                        </div>

                        <p className="text-gray-600 mb-3">{evento.descricao}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatarData(evento.dataInicio)}
                            {evento.dataFim && ` - ${formatarData(evento.dataFim)}`}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {evento.tipoEvento?.nome || evento.tipoEventoGlobal?.nome || 'Evento'}
                          </div>
                        </div>
                      </div>

                      {evento.inscricaoAtiva && evento.slug && (
                        <Button asChild variant="outline" size="sm">
                          <a href={`/inscricao/${evento.slug}`}>
                            Inscrever-se
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventosPublicos;
