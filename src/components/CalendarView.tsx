import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ExternalLink, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Evento, ENivelCompartilhamento, Sala, TipoDeSala } from '@/types/api';

interface CalendarViewProps {
  eventos: Evento[];
  salas?: Sala[];
  tiposDeSalas?: TipoDeSala[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ eventos, salas = [], tiposDeSalas = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Função para obter a cor do tipo de sala
  const getTipoDeSalaCor = (tipoDeSalaId: number): string => {
    const tipoSala = tiposDeSalas.find(tipo => tipo.id === tipoDeSalaId);
    return tipoSala?.cor || '#6b7280';
  };

  const getEventosForDay = (day: Date) => {
    return eventos.filter(evento => {
      const startDate = parseISO(evento.dataInicio);
      const endDate = parseISO(evento.dataFim);

      if (evento.allDay) {
        // Para eventos de dia inteiro, verificar se o dia está dentro do intervalo
        const adjustedEndDate = new Date(endDate);
        return isWithinInterval(day, { start: startDate, end: adjustedEndDate }) ||
          isSameDay(startDate, day) ||
          isSameDay(adjustedEndDate, day);
      }

      return isSameDay(startDate, day);
    });
  };

  const getSalasForDay = (day: Date) => {
    // Filtrar salas que não estão vinculadas a eventos
    const salasVinculadas = eventos
      .filter(e => e.sala?.id)
      .map(e => e.sala!.id);

    return salas.filter(sala => {
      // Não mostrar salas que já estão vinculadas a eventos
      if (salasVinculadas.includes(sala.id)) {
        return false;
      }

      const startDate = parseISO(sala.dataInicio);
      const endDate = parseISO(sala.dataFim);

      if (sala.allDay) {
        const adjustedEndDate = new Date(endDate);
        return isWithinInterval(day, { start: startDate, end: adjustedEndDate }) ||
          isSameDay(startDate, day) ||
          isSameDay(adjustedEndDate, day);
      }

      return isSameDay(startDate, day);
    });
  };

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

  const generateInscricaoLink = (evento: Evento) => {
    if (evento.slug) {
      return `/inscricao/${evento.slug}`;
    }
    return `/inscricao/${evento.id}`;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Função para tornar a cor mais clara para o texto
  const lightenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Cabeçalho com dias da semana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grade do calendário com estilo Google Calendar */}
        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const eventosDay = getEventosForDay(day);
            const salasDay = getSalasForDay(day);
            const isCurrentDay = isToday(day);
            const allItems = [...eventosDay, ...salasDay];

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-2 border rounded-lg transition-colors ${isCurrentDay
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <div className={`text-sm font-medium mb-2 ${isCurrentDay ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {/* Renderizar eventos estilo Google Calendar */}
                  {eventosDay.slice(0, 3).map(evento => {
                    const startDate = parseISO(evento.dataInicio);
                    const endDate = parseISO(evento.dataFim);
                    const isAllDay = evento.allDay;
                    const temSala = evento.sala?.id;
                    const tipoSala = temSala ? tiposDeSalas.find(ts => ts.id === evento.sala!.tipoDeSalaId) : null;

                    const tituloCompleto = temSala
                      ? `${evento.titulo} ${tipoSala?.nome || 'Sala'}`
                      : evento.titulo;

                    const tooltipText = temSala
                      ? `${evento.titulo}\n ${tipoSala?.nome || 'Sala'}\n${evento.descricao}\n${isAllDay ? 'Evento de dia inteiro' : format(startDate, 'HH:mm') + ' - ' + format(endDate, 'HH:mm')}`
                      : `${evento.titulo}\n${evento.descricao}\n${isAllDay ? 'Evento de dia inteiro' : format(startDate, 'HH:mm') + ' - ' + format(endDate, 'HH:mm')}`;

                    if (isAllDay) {
                      // Evento de dia inteiro - barra colorida completa
                      return (
                        <div
                          key={`evento-${evento.id}`}
                          className="text-xs p-1 rounded-sm cursor-pointer hover:shadow-sm transition-shadow"
                          style={{
                            backgroundColor: evento.tipoEvento.cor,
                            color: '#ffffff'
                          }}
                          title={tooltipText}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate font-medium">
                              {tituloCompleto}
                            </span>
                            {evento.inscricaoAtiva && (
                              <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-70" />
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      // Evento com horário - ponto colorido + texto
                      return (
                        <div
                          key={`evento-${evento.id}`}
                          className="text-xs p-1 rounded-sm cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-1"
                          title={tooltipText}
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: evento.tipoEvento.cor }}
                          ></div>
                          <span className="text-gray-600 text-xs">
                            {format(startDate, 'HH:mm')}
                          </span>
                          <span className="truncate font-medium text-gray-800">
                            {tituloCompleto}
                          </span>
                          {evento.inscricaoAtiva && (
                            <ExternalLink className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          )}
                        </div>
                      );
                    }
                  })}

                  {/* Renderizar salas estilo Google Calendar */}
                  {salasDay.slice(0, Math.max(0, 3 - eventosDay.length)).map(sala => {
                    const startDate = parseISO(sala.dataInicio);
                    const endDate = parseISO(sala.dataFim);
                    const corTipoSala = getTipoDeSalaCor(sala.tipoDeSalaId);
                    const tipoSala = tiposDeSalas.find(tipo => tipo.id === sala.tipoDeSalaId);
                    const isAllDay = sala.allDay;

                    if (isAllDay) {
                      return (
                        <div
                          key={`sala-${sala.id}`}
                          className="text-xs p-1 rounded-sm cursor-pointer hover:shadow-sm transition-shadow"
                          style={{
                            backgroundColor: corTipoSala,
                            color: '#ffffff'
                          }}
                          title={`Sala: ${tipoSala?.nome || 'Sala'}\n${sala.descricao || 'Reserva'}\nReserva de dia inteiro`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-sm">🏛️</span>
                            <span className="truncate font-medium">
                              {tipoSala?.nome || 'Sala'}
                            </span>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={`sala-${sala.id}`}
                          className="text-xs p-1 rounded-sm cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-1"
                          title={`Sala: ${tipoSala?.nome || 'Sala'}\n${sala.descricao || 'Reserva'}\n${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`}
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: corTipoSala }}
                          ></div>
                          <span className="text-sm">🏛️</span>
                          <span className="text-gray-600 text-xs">
                            {format(startDate, 'HH:mm')}
                          </span>
                          <span className="truncate font-medium text-gray-800">
                            {tipoSala?.nome || 'Sala'}
                          </span>
                        </div>
                      );
                    }
                  })}

                  {allItems.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium p-1">
                      +{allItems.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="mt-6 pt-4 border-t space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Tipos de Eventos:</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(eventos.map(e => e.tipoEvento)))
                .filter((tipo, index, self) => self.findIndex(t => t.id === tipo.id) === index)
                .map(tipo => (
                  <Badge
                    key={tipo.id}
                    style={{
                      backgroundColor: tipo.cor,
                      color: '#ffffff',
                      border: `1px solid ${tipo.cor}`
                    }}
                  >
                    {tipo.nome}
                  </Badge>
                ))
              }
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Níveis de Compartilhamento:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-gray-100 text-gray-700">Local</Badge>
              <Badge className="bg-blue-100 text-blue-700">Entre Paróquias</Badge>
              <Badge className="bg-purple-100 text-purple-700">Diocese</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <ExternalLink className="h-3 w-3" />
              <span>Indica eventos com inscrições online ativas</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Eventos/reservas com horário específico</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-2 bg-gray-400 rounded-sm"></div>
              <span>Eventos/reservas de dia inteiro</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
