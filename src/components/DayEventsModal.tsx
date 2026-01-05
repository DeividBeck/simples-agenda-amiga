import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, MapPin, Plus, ExternalLink } from 'lucide-react';
import { Evento, Sala, TipoDeSala } from '@/types/api';
import { Badge } from '@/components/ui/badge';

interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  eventos: Evento[];
  salas: Sala[];
  tiposDeSalas: TipoDeSala[];
  onEventClick: (evento: Evento) => void;
  onSalaClick: (sala: Sala) => void;
  onAddEvento: (date: Date) => void;
  canAddEvento: boolean;
}

export const DayEventsModal: React.FC<DayEventsModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  eventos,
  salas,
  tiposDeSalas,
  onEventClick,
  onSalaClick,
  onAddEvento,
  canAddEvento
}) => {
  if (!selectedDate) return null;

  // Filtrar eventos e salas do dia selecionado
  const getEventosForDay = () => {
    return eventos.filter(evento => {
      const start = new Date(evento.dataInicio);
      const end = new Date(evento.dataFim);
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      return (start <= dayEnd && end >= dayStart);
    });
  };

  const getSalasForDay = () => {
    // Filtrar salas vinculadas a eventos
    const salasVinculadas = eventos
      .filter(e => e.sala?.id)
      .map(e => e.sala!.id);

    return salas.filter(sala => {
      if (salasVinculadas.includes(sala.id)) return false;

      const start = new Date(sala.dataInicio);
      const end = new Date(sala.dataFim);
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      return (start <= dayEnd && end >= dayStart);
    });
  };

  const getTipoDeSalaNome = (tipoDeSalaId: number) => {
    const tipo = tiposDeSalas.find(t => t.id === tipoDeSalaId);
    return tipo?.nome || 'Sala';
  };

  const getTipoDeSalaCor = (tipoDeSalaId: number) => {
    const tipo = tiposDeSalas.find(t => t.id === tipoDeSalaId);
    return tipo?.cor || '#6b7280';
  };

  const eventosDodia = getEventosForDay();
  const salasDodia = getSalasForDay();
  const totalItems = eventosDodia.length + salasDodia.length;

  const formatTime = (dateString: string, allDay?: boolean) => {
    if (allDay) return 'Dia inteiro';
    return format(new Date(dateString), 'HH:mm');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] mx-auto max-h-[80vh] flex flex-col">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          {totalItems === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum evento neste dia</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {/* Eventos */}
              {eventosDodia.map(evento => (
                <button
                  key={`evento-${evento.id}`}
                  onClick={() => onEventClick(evento)}
                  className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex gap-3">
                    <div
                      className="w-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: evento.tipoEvento.cor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm line-clamp-2">{evento.titulo}</h4>
                        {evento.inscricaoAtiva && evento.slug && (
                          <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTime(evento.dataInicio, evento.allDay)}
                          {!evento.allDay && ` - ${formatTime(evento.dataFim)}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0"
                          style={{
                            backgroundColor: `${evento.tipoEvento.cor}20`,
                            color: evento.tipoEvento.cor,
                            borderColor: evento.tipoEvento.cor
                          }}
                        >
                          {evento.tipoEvento.nome}
                        </Badge>

                        {evento.sala && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            <MapPin className="h-2.5 w-2.5 mr-1" />
                            {evento.sala.nomeTipoDeSala || getTipoDeSalaNome(evento.sala.tipoDeSalaId)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {/* Salas independentes */}
              {salasDodia.map(sala => (
                <button
                  key={`sala-${sala.id}`}
                  onClick={() => onSalaClick(sala)}
                  className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex gap-3">
                    <div
                      className="w-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getTipoDeSalaCor(sala.tipoDeSalaId) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <h4 className="font-medium text-sm truncate">
                          {getTipoDeSalaNome(sala.tipoDeSalaId)}
                        </h4>
                      </div>

                      {sala.descricao && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {sala.descricao}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTime(sala.dataInicio, sala.allDay)}
                          {!sala.allDay && ` - ${formatTime(sala.dataFim)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {canAddEvento && (
          <div className="pt-3 border-t mt-2">
            <Button
              onClick={() => onAddEvento(selectedDate)}
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar evento
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
