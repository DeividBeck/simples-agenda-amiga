import React, { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, ExternalLink, MapPin, Clock } from 'lucide-react';
import { Evento, Sala, TipoDeSala } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { ViewEventoModal } from './ViewEventoModal';
import { ViewSalaModal } from './ViewSalaModal';
import { EditEventoModal } from './EditEventoModal';
import { EditSalaModal } from './EditSalaModal';
import { useClaims } from '@/hooks/useClaims';

interface FullCalendarViewProps {
  eventos: Evento[];
  salas?: Sala[];
  tiposDeSalas?: TipoDeSala[];
  onCreateEvento?: (date?: Date) => void;
}

export const FullCalendarView: React.FC<FullCalendarViewProps> = ({
  eventos,
  salas = [],
  tiposDeSalas = [],
  onCreateEvento
}) => {
  const { toast } = useToast();
  const calendarRef = useRef<FullCalendar>(null);
  const { canEditEventos, canEditSalas, canReadEventos, canReadSalas } = useClaims();

  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedSala, setSelectedSala] = useState<Sala | null>(null);
  const [showViewEventoModal, setShowViewEventoModal] = useState(false);
  const [showViewSalaModal, setShowViewSalaModal] = useState(false);
  const [showEditEventoModal, setShowEditEventoModal] = useState(false);
  const [showEditSalaModal, setShowEditSalaModal] = useState(false);

  // Função para obter a cor do tipo de sala
  const getTipoDeSalaCor = (tipoDeSalaId: number): string => {
    const tipoSala = tiposDeSalas.find(tipo => tipo.id === tipoDeSalaId);
    const cor = tipoSala?.cor || '#6b7280';
    return cor;
  };

  // Converter eventos para o formato do FullCalendar
  const eventosCalendar = eventos.map(evento => {
    const isAllDay = evento.allDay;
    let endDate = evento.dataFim;

    // Para eventos de dia inteiro, adicionar um dia à data de fim para o FullCalendar mostrar corretamente
    if (isAllDay) {
      const dataFim = new Date(evento.dataFim);
      dataFim.setDate(dataFim.getDate() + 1);
      endDate = dataFim.toISOString();
    }

    // Se o evento tem sala vinculada, incluir no título
    const temSala = evento.sala?.id;
    const tipoSala = temSala ? tiposDeSalas.find(ts => ts.id === evento.sala!.tipoDeSalaId) : null;
    const titulo = temSala
      ? `${evento.titulo} - 🏛️ ${tipoSala?.nome || 'Sala'}`
      : evento.titulo;

    return {
      id: `evento-${evento.id}`,
      title: titulo,
      start: evento.dataInicio,
      end: endDate,
      allDay: isAllDay,
      backgroundColor: isAllDay ? evento.tipoEvento.cor : 'transparent',
      borderColor: evento.tipoEvento.cor,
      textColor: isAllDay ? '#ffffff' : evento.tipoEvento.cor,
      classNames: [
        'fc-event-paroquial',
        isAllDay ? 'fc-event-all-day' : 'fc-event-timed'
      ],
      display: isAllDay ? 'block' : 'auto',
      extendedProps: {
        type: 'evento',
        evento: evento,
        descricao: evento.descricao,
        tipoEvento: evento.tipoEvento.nome,
        inscricaoAtiva: evento.inscricaoAtiva,
        nivelCompartilhamento: evento.nivelCompartilhamento,
        slug: evento.slug,
        isAllDay: isAllDay,
        temSala: temSala,
        nomeSala: tipoSala?.nome
      }
    };
  });

  // Filtrar salas que não estão vinculadas a eventos
  const salasVinculadas = eventos
    .filter(e => e.sala?.id)
    .map(e => e.sala!.id);

  const salasIndependentes = salas.filter(sala => !salasVinculadas.includes(sala.id));

  // Converter salas independentes para o formato do FullCalendar
  const salasCalendar = salasIndependentes.map(sala => {
    const tipoSala = tiposDeSalas.find(tipo => tipo.id === sala.tipoDeSalaId);
    const corTipoSala = tipoSala?.cor || '#22c55e'; // Verde padrão se não encontrar
    const isAllDay = sala.allDay;

    let endDate = sala.dataFim;
    if (isAllDay) {
      const dataFim = new Date(sala.dataFim);
      dataFim.setDate(dataFim.getDate() + 1);
      endDate = dataFim.toISOString();
    }

    return {
      id: `sala-${sala.id}`,
      title: `🏛️ ${tipoSala?.nome || 'Sala'} - ${sala.descricao || 'Reserva'}`,
      start: sala.dataInicio,
      end: endDate,
      allDay: isAllDay,
      backgroundColor: isAllDay ? corTipoSala : 'transparent',
      borderColor: corTipoSala,
      textColor: isAllDay ? '#ffffff' : corTipoSala,
      classNames: [
        'fc-event-sala',
        isAllDay ? 'fc-event-all-day' : 'fc-event-timed'
      ],
      display: isAllDay ? 'block' : 'auto',
      extendedProps: {
        type: 'sala',
        sala: sala,
        descricao: sala.descricao,
        tipoDeSala: tipoSala?.nome || 'Sala',
        status: sala.status,
        capacidade: tipoSala?.capacidade,
        isAllDay: isAllDay,
        cor: corTipoSala
      }
    };
  });

  // Combinar eventos e salas
  const allEvents = [...eventosCalendar, ...salasCalendar];

  const handleEventClick = (clickInfo: any) => {
    const eventType = clickInfo.event.extendedProps.type;

    if (eventType === 'evento') {
      const evento = clickInfo.event.extendedProps.evento;

      if (canReadEventos()) {
        setSelectedEvento(evento);
        setShowViewEventoModal(true);
      } else {
        toast({
          title: 'Acesso negado',
          description: 'Você não tem permissão para visualizar eventos.',
          variant: 'destructive',
        });
      }
    } else if (eventType === 'sala') {
      const sala = clickInfo.event.extendedProps.sala;

      if (canReadSalas()) {
        setSelectedSala(sala);
        setShowViewSalaModal(true);
      } else {
        toast({
          title: 'Acesso negado',
          description: 'Você não tem permissão para visualizar reservas de sala.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEditEvento = () => {
    setShowViewEventoModal(false);
    setShowEditEventoModal(true);
  };

  const handleEditSala = () => {
    setShowViewSalaModal(false);
    setShowEditSalaModal(true);
  };

  const handleCloseEditEventoModal = () => {
    setShowEditEventoModal(false);
    setSelectedEvento(null);
  };

  const handleCloseEditSalaModal = () => {
    setShowEditSalaModal(false);
    setSelectedSala(null);
  };

  const handleDateSelect = (selectInfo: any) => {
    if (onCreateEvento) {
      onCreateEvento(selectInfo.start);
    }
  };

  const handleDateClick = (dateInfo: any) => {
    if (onCreateEvento) {
      onCreateEvento(dateInfo.date);
    }
  };

  // Função para renderizar o conteúdo do evento
  const renderEventContent = (eventInfo: any) => {
    const eventType = eventInfo.event.extendedProps.type;
    const isAllDay = eventInfo.event.extendedProps.isAllDay;

    if (eventType === 'evento') {
      const evento = eventInfo.event.extendedProps.evento;

      if (isAllDay) {
        // Evento de dia inteiro - estilo similar ao Google Calendar
        return (
          <div className="fc-event-main-frame p-1 w-full overflow-hidden" title={eventInfo.event.title}>
            <div className="fc-event-title-container overflow-hidden">
              <div className="fc-event-title fc-sticky flex items-center gap-1 overflow-hidden">
                <span className="font-medium text-sm truncate block max-w-full">{eventInfo.event.title}</span>
                {evento.inscricaoAtiva && evento.slug && (
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        );
      } else {
        // Evento com horário - mostrar como ponto/barra colorida
        return (
          <div className="fc-event-main-frame p-1 overflow-hidden" title={eventInfo.event.title}>
            <div className="flex items-center gap-1 overflow-hidden max-w-full">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: evento.tipoEvento.cor }}
              ></div>
              <span className="font-medium text-xs flex-shrink-0">{eventInfo.timeText}</span>
              <span className="text-xs truncate block">{eventInfo.event.title}</span>
              {evento.inscricaoAtiva && evento.slug && (
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              )}
            </div>
          </div>
        );
      }
    } else {
      // Sala
      if (isAllDay) {
        return (
          <div className="fc-event-main-frame p-1 w-full overflow-hidden" title={eventInfo.event.title}>
            <div className="fc-event-title-container overflow-hidden">
              <div className="fc-event-title fc-sticky flex items-center gap-1 overflow-hidden">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="font-medium text-sm truncate block max-w-full">{eventInfo.event.title}</span>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="fc-event-main-frame p-1 overflow-hidden" title={eventInfo.event.title}>
            <div className="flex items-center gap-1 overflow-hidden max-w-full">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: eventInfo.event.borderColor }}
              ></div>
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="font-medium text-xs flex-shrink-0">{eventInfo.timeText}</span>
              <span className="text-xs truncate block">{eventInfo.event.title}</span>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles de navegação responsivos */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => calendarRef.current?.getApi().prev()}
            className="bg-white/70 backdrop-blur-sm border-white/30 hover:bg-white/90 p-2 sm:px-3"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => calendarRef.current?.getApi().today()}
            className="bg-white/70 backdrop-blur-sm border-white/30 hover:bg-white/90 px-2 sm:px-3"
          >
            <Calendar className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Hoje</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => calendarRef.current?.getApi().next()}
            className="bg-white/70 backdrop-blur-sm border-white/30 hover:bg-white/90 p-2 sm:px-3"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendário Principal responsivo */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-white/30">
        <style>{`
          .fc-event-all-day {
            border-radius: 4px !important;
            padding: 2px 6px !important;
            font-weight: 500 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }
          .fc-event-timed {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 1px 2px !important;
            overflow: hidden !important;
            max-width: 100% !important;
          }
          .fc-event-timed:hover {
            background: rgba(0,0,0,0.05) !important;
          }
          .fc-event-main-frame {
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
          }
          .fc-event-title, .fc-event-title-container {
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            max-width: 100% !important;
          }
          .fc-daygrid-event {
            overflow: hidden !important;
            white-space: nowrap !important;
          }
          .fc-daygrid-event-harness {
            overflow: hidden !important;
          }
        `}</style>
        <div className="[&_.fc]:rounded-xl [&_.fc]:overflow-hidden [&_.fc-toolbar]:p-2 sm:[&_.fc-toolbar]:p-4 [&_.fc-toolbar]:bg-gradient-to-r [&_.fc-toolbar]:from-slate-50 [&_.fc-toolbar]:to-slate-100 [&_.fc-toolbar]:border-b [&_.fc-toolbar]:border-slate-200 [&_.fc-toolbar-title]:text-lg sm:[&_.fc-toolbar-title]:text-2xl [&_.fc-toolbar-title]:font-semibold [&_.fc-toolbar-title]:text-slate-800 [&_.fc-button]:bg-white [&_.fc-button]:border [&_.fc-button]:border-slate-300 [&_.fc-button]:text-slate-600 [&_.fc-button]:rounded-lg [&_.fc-button]:font-medium [&_.fc-button]:px-2 sm:[&_.fc-button]:px-4 [&_.fc-button]:py-1 sm:[&_.fc-button]:py-2 [&_.fc-button]:transition-all [&_.fc-button]:duration-200 [&_.fc-button]:text-xs sm:[&_.fc-button]:text-sm [&_.fc-button:hover]:bg-slate-50 [&_.fc-button:hover]:border-slate-400 [&_.fc-button:hover]:shadow-sm [&_.fc-button-active]:bg-blue-600 [&_.fc-button-active]:border-blue-600 [&_.fc-button-active]:text-white [&_.fc-daygrid-day]:border-slate-100 [&_.fc-daygrid-day:hover]:bg-slate-50 [&_.fc-day-today]:bg-blue-50 [&_.fc-day-today]:border-blue-600 [&_.fc-event]:rounded-md [&_.fc-event]:border [&_.fc-event]:shadow-sm [&_.fc-event]:transition-all [&_.fc-event]:duration-200 [&_.fc-event:hover]:transform [&_.fc-event:hover]:-translate-y-0.5 [&_.fc-event:hover]:shadow-md [&_.fc-col-header]:bg-slate-50 [&_.fc-col-header]:border-slate-200 [&_.fc-col-header-cell]:py-2 sm:[&_.fc-col-header-cell]:py-3 [&_.fc-col-header-cell]:px-1 sm:[&_.fc-col-header-cell]:px-2 [&_.fc-col-header-cell]:font-semibold [&_.fc-col-header-cell]:text-slate-700 [&_.fc-col-header-cell]:text-xs [&_.fc-col-header-cell]:uppercase [&_.fc-col-header-cell]:tracking-wide">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: '',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,listWeek'
            }}
            locale="pt-br"
            buttonText={{
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
              list: 'Lista'
            }}
            events={allEvents}
            eventClick={handleEventClick}
            selectable={true}
            selectMirror={true}
            select={handleDateSelect}
            dateClick={handleDateClick}
            dayMaxEvents={false}
            moreLinkText={(num) => `+${num}`}
            height="auto"
            contentHeight="auto"
            aspectRatio={window.innerWidth < 768 ? 0.8 : 1.35}
            eventContent={renderEventContent}
            eventClassNames="cursor-pointer transition-all duration-200"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={true}
            allDayText="Todo dia"
            nowIndicator={true}
            weekNumbers={false}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            dayHeaderFormat={{
              weekday: 'short',
              day: 'numeric'
            }}
            eventDisplay="auto"
            displayEventTime={true}
            stickyHeaderDates={true}
            expandRows={true}
            handleWindowResize={true}
            windowResizeDelay={100}
          />
        </div>
      </div>

      {/* Modais de Visualização */}
      <ViewEventoModal
        isOpen={showViewEventoModal}
        onClose={() => {
          setShowViewEventoModal(false);
          setSelectedEvento(null);
        }}
        evento={selectedEvento}
        onEdit={handleEditEvento}
        canEdit={canEditEventos()}
      />

      <ViewSalaModal
        isOpen={showViewSalaModal}
        onClose={() => {
          setShowViewSalaModal(false);
          setSelectedSala(null);
        }}
        sala={selectedSala}
        onEdit={handleEditSala}
        canEdit={canEditSalas()}
      />

      {/* Modais de Edição */}
      <EditEventoModal
        isOpen={showEditEventoModal}
        onClose={handleCloseEditEventoModal}
        evento={selectedEvento}
      />

      <EditSalaModal
        isOpen={showEditSalaModal}
        onClose={handleCloseEditSalaModal}
        sala={selectedSala}
      />
    </div>
  );
};
