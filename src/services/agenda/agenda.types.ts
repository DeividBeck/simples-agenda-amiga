// Tipos específicos da camada de serviço da agenda
// Os tipos compartilhados (Evento, Sala, etc.) permanecem em src/types/api.ts

export interface FilialData {
  id: number;
  nome: string;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  representanteLegal: string | null;
  rgRepresentante: string | null;
  cpfRepresentante: string | null;
  banco: string | null;
  agencia: string | null;
  contaCorrente: string | null;
  chavePix: string | null;
}

export interface TipoEventoGlobal {
  id: number;
  empresaId: number;
  nome: string;
  cor: string;
  disponivel: boolean;
  empresa: {
    id: number;
    name: string;
    cnpj: string;
  } | null;
}

export interface CreateReservaDto {
  eventoId: number;
  interessadoId: number;
  status?: string;
  valorTotal?: number | null;
  valorSinal?: number | null;
  dataVencimentoSinal?: string | null;
  quantidadeParticipantes?: number | null;
  observacoes?: string | null;
  parcelas?: ParcelaDto[] | null;
}

export interface ParcelaDto {
  id?: number;
  numeroParcela: number;
  valor: number;
  dataVencimento: string;
  isSinal: boolean;
}
