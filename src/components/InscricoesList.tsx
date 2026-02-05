
import React, { useState } from 'react';
import { Users, Download, Search, Mail, Phone, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useInscricoesEvento } from '@/hooks/useApi';
import { Evento, FichaInscricao } from '@/types/api';

interface InscricoesListProps {
  eventos: Evento[];
}

export const InscricoesList: React.FC<InscricoesListProps> = ({ eventos }) => {
  const [eventoSelecionado, setEventoSelecionado] = useState<number | null>(null);
  const [filtroNome, setFiltroNome] = useState('');

  // Filtrar apenas eventos com inscrições online ativas
  const eventosComInscricao = eventos.filter(evento => evento.inscricaoAtiva && evento.slug);

  const { data: inscricoes, isLoading } = useInscricoesEvento(eventoSelecionado || 0);

  // Filtrar inscrições por nome
  const inscricoesFiltradas = inscricoes?.filter(inscricao =>
    inscricao.nome.toLowerCase().includes(filtroNome.toLowerCase()) ||
    inscricao.email.toLowerCase().includes(filtroNome.toLowerCase())
  ) || [];

  const handleExportarCSV = () => {
    if (!inscricoesFiltradas.length) return;

    // Encontrar o evento selecionado para incluir no nome do arquivo
    const evento = eventos.find(e => e.id === eventoSelecionado);
    const nomeEvento = evento ? evento.titulo.replace(/[^a-zA-Z0-9]/g, '_') : 'evento';

    // Criar cabeçalhos do CSV
    const headers = ['Nome', 'Email', 'Telefone', 'Nome do Pai', 'Nome da Mãe'];
    
    // Função para escapar valores CSV
    const escapeCsvValue = (value: string | null | undefined): string => {
      if (!value) return '';
      // Escapar aspas duplas duplicando-as e envolver em aspas se necessário
      const escaped = value.replace(/"/g, '""');
      // Envolver em aspas se contém vírgula, quebra de linha ou aspas
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      return escaped;
    };

    // Criar linhas do CSV
    const csvLines = [
      headers.join(','),
      ...inscricoesFiltradas.map(inscricao => [
        escapeCsvValue(inscricao.nome),
        escapeCsvValue(inscricao.email),
        escapeCsvValue(inscricao.telefone),
        escapeCsvValue(inscricao.nomePai),
        escapeCsvValue(inscricao.nomeMae)
      ].join(','))
    ];

    // Adicionar BOM para UTF-8 para garantir que acentos sejam exibidos corretamente
    const csvContent = '\uFEFF' + csvLines.join('\n');

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inscricoes_${nomeEvento}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (eventosComInscricao.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum evento com inscrições online encontrado.</p>
            <p className="text-sm mt-2">Crie eventos com "Inscrições Online" ativadas para ver as inscrições aqui.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Evento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Inscrições Online
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select 
                value={eventoSelecionado?.toString() || ''} 
                onValueChange={(value) => setEventoSelecionado(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento para ver as inscrições" />
                </SelectTrigger>
                <SelectContent>
                  {eventosComInscricao.map((evento) => (
                    <SelectItem key={evento.id} value={evento.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: evento.tipoEvento?.cor || evento.tipoEventoGlobal?.cor || '#6b7280' }}
                        />
                        {evento.titulo}
                        <Badge variant="secondary" className="ml-2">
                          {new Date(evento.dataInicio).toLocaleDateString()}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Inscrições */}
      {eventoSelecionado && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Inscrições ({inscricoesFiltradas.length})
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={filtroNome}
                    onChange={(e) => setFiltroNome(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={handleExportarCSV}
                  variant="outline"
                  disabled={!inscricoesFiltradas.length}
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Carregando inscrições...</p>
              </div>
            ) : inscricoesFiltradas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma inscrição encontrada para este evento.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Nome
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefone
                        </div>
                      </TableHead>
                      <TableHead>Nome do Pai</TableHead>
                      <TableHead>Nome da Mãe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inscricoesFiltradas.map((inscricao) => (
                      <TableRow key={inscricao.id}>
                        <TableCell className="font-medium">{inscricao.nome}</TableCell>
                        <TableCell>{inscricao.email}</TableCell>
                        <TableCell>{inscricao.telefone}</TableCell>
                        <TableCell>{inscricao.nomePai}</TableCell>
                        <TableCell>{inscricao.nomeMae}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
