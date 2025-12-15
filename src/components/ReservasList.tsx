import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Eye, Search, Circle, Loader } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Reserva, EStatusReservaContrato } from '@/types/api';
import { ReservaDetailsModal } from './ReservaDetailsModal';

interface ReservasListProps {
  reservas: Reserva[];
  isLoading: boolean;
}

const getStatusInfo = (reserva: Reserva) => {
  // 🟢 Pronto: DadosPreenchidos = true
  if (reserva.dadosPreenchidos) {
    return {
      color: 'bg-green-500',
      label: 'Pronto',
      description: 'Dados preenchidos pelo cliente',
      variant: 'default' as const,
    };
  }

  // 🟡 Confirmado (Incompleto): Status = Confirmado mas DadosPreenchidos = false
  if (reserva.status === EStatusReservaContrato.Confirmado) {
    return {
      color: 'bg-yellow-500',
      label: 'Incompleto',
      description: 'Aguardando preenchimento dos dados',
      variant: 'secondary' as const,
    };
  }

  // 🔴 Pendente: Email enviado, aguardando clique
  return {
    color: 'bg-red-500',
    label: 'Pendente',
    description: 'Aguardando confirmação do cliente',
    variant: 'destructive' as const,
  };
};

export const ReservasList: React.FC<ReservasListProps> = ({ reservas, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  const filteredReservas = reservas.filter(reserva => {
    const searchLower = searchTerm.toLowerCase();
    return (
      reserva.evento?.titulo?.toLowerCase().includes(searchLower) ||
      reserva.interessado?.nome?.toLowerCase().includes(searchLower) ||
      reserva.interessado?.email?.toLowerCase().includes(searchLower)
    );
  });

  // Ordenar: Prontos primeiro, depois Incompletos, depois Pendentes
  const sortedReservas = [...filteredReservas].sort((a, b) => {
    const getPriority = (r: Reserva) => {
      if (r.dadosPreenchidos) return 0; // Pronto
      if (r.status === EStatusReservaContrato.Confirmado) return 1; // Incompleto
      return 2; // Pendente
    };
    return getPriority(a) - getPriority(b);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando reservas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por evento ou interessado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Circle className="h-3 w-3 fill-red-500 text-red-500" />
          <span>Pendente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
          <span>Incompleto</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Circle className="h-3 w-3 fill-green-500 text-green-500" />
          <span>Pronto</span>
        </div>
      </div>

      {sortedReservas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <FileText className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhuma reserva encontrada</p>
          <p className="text-sm">As reservas aparecerão aqui quando eventos com interessados forem criados.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">Status</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Interessado</TableHead>
                <TableHead>Data do Evento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReservas.map((reserva) => {
                const statusInfo = getStatusInfo(reserva);
                return (
                  <TableRow key={reserva.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2" title={statusInfo.description}>
                        <Circle className={`h-3 w-3 fill-current ${statusInfo.color.replace('bg-', 'text-')}`} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{reserva.evento?.titulo || 'Evento não encontrado'}</div>
                      <div className="text-xs text-muted-foreground">
                        {reserva.evento?.tipoEvento?.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{reserva.interessado?.nome || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">
                        {reserva.interessado?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reserva.evento?.dataInicio ? (
                        <div>
                          <div className="font-medium">
                            {format(new Date(reserva.evento.dataInicio), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(reserva.evento.dataInicio), "HH:mm", { locale: ptBR })} - 
                            {reserva.evento.dataFim && format(new Date(reserva.evento.dataFim), " HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {reserva.valorTotal ? (
                        <div className="font-medium text-green-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reserva.valorTotal)}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          A definir
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReserva(reserva)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de Detalhes */}
      <ReservaDetailsModal
        isOpen={!!selectedReserva}
        onClose={() => setSelectedReserva(null)}
        reserva={selectedReserva}
      />
    </div>
  );
};
