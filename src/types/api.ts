export enum ETipoContrato {
  Nenhum = 0,
  Casamento = 1,
  Diverso = 2
}

export interface TipoEvento {
  id: number;
  nome: string;
  cor: string;
  categoriaContrato: ETipoContrato;
}

export interface Interessado {
  id: number;
  nome: string;
  documento: string;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  pontoReferencia: string | null;
  telefone: string;
  email: string;
  emailFinanceiro: string | null;
}

export interface Filial {
  id: number;
  empresaId: number;
  nome: string;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  empresa: any | null;
}

export enum ENivelCompartilhamento {
  Local = 0,
  EntreParoquias = 1,
  Diocese = 2
}

export enum ENomeFormulario {
  PreparacaoBatismo = 0,
  PreparacaoMatrimonio = 1,
  Catequese = 2
}

export enum ERecorrencia {
  NaoRepete = 0,
  Diariamente = 1,
  Semanalmente = 2,
  Quinzenalmente = 3,
  Mensalmente = 4
}

export enum EStatusReserva {
  Pendente = 0,
  Aprovado = 1,
  Rejeitado = 2,
  Cancelado = 3
}

export enum EStatusReservaContrato {
  Pendente = 0,
  Confirmado = 1,
  Recusado = 2,
  Expirado = 3
}

export interface Reserva {
  id: number;
  eventoId: number;
  interessadoId: number;
  status: EStatusReservaContrato | string;
  tokenConfirmacao: string;
  dataEnvioEmail?: string | null;
  dataConfirmacao?: string | null;
  dataExpiracao: string | null;
  contratoGerado?: boolean;
  dataGeracaoContrato?: string | null;
  contratoEnviado?: boolean;
  dataEnvioContrato?: string | null;
  dadosPreenchidos: boolean;
  tokenPreenchimento?: string | null;
  observacoes: string | null;
  filialId?: number;
  // Campos que vêm diretamente da API
  nomeInteressado?: string | null;
  tituloEvento?: string | null;
  // Dados do contrato (Admin)
  valorTotal?: number | null;
  valorSinal?: number | null;
  quantidadeParticipantes?: number | null;
  // Relacionamentos (quando disponíveis)
  evento?: Evento | null;
  interessado?: Interessado | null;
}

export interface ReservaDto {
  id: number;
  // Campos mínimos frequentemente exigidos por validação do backend
  eventoId?: number;
  interessadoId?: number;
  status?: EStatusReservaContrato | string;
  tokenConfirmacao?: string;
  dataExpiracao?: string | null;
  dadosPreenchidos?: boolean;
  nomeInteressado?: string | null;
  tituloEvento?: string | null;

  // Campos editáveis pelo Admin
  valorTotal?: number | null;
  valorSinal?: number | null;
  quantidadeParticipantes?: number | null;
  observacoes?: string | null;
}

export enum EEdicaoRecorrencia {
  Este = 0,
  EsteEfuturos = 1,
  Todos = 2
}

export enum EExclusaoRecorrencia {
  Este = 0,
  EsteEfuturos = 1,
  Todos = 2
}

export interface Evento {
  id: number;
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  allDay: boolean;
  tipoEventoId: number;
  inscricaoAtiva: boolean;
  nomeFormulario: ENomeFormulario | null;
  slug: string | null;
  nivelCompartilhamento: ENivelCompartilhamento;
  tipoEvento: TipoEvento;
  filialId: number;
  filial: Filial | null;
  recorrencia?: ERecorrencia;
  fimRecorrencia?: string | null;
  eventoOrigemId?: number | null;
  eventoPaiId?: number | null;
  eventoPai?: Evento | null;
  sala?: Sala | null;
  salaId?: number | null;
  interessadoId?: number | null;
  interessado?: Interessado | null;
  reserva?: Reserva | null;
}

export interface TipoDeSala {
  id: number;
  nome: string;
  capacidade: number;
  cor: string;
  localizacao: string | null;
  descricao: string | null;
  equipamentosJson: string;
  disponivel: boolean;
  dataCriacao: string;
  dataAtualizacao: string | null;
  equipamentos: string[];
}

export interface Sala {
  id: number;
  descricao: string | null;
  dataInicio: string;
  dataFim: string;
  allDay: boolean;
  tipoDeSalaId: number;
  tipoDeSala: TipoDeSala | null;
  status: EStatusReserva; // Corrigido: agora é EStatusReserva
  dataCriacao: string;
}

export interface StatusSala {
  id: number;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  tipoDeSalaId: string;
  nomeTipoDeSala: string | null;
  status: EStatusReserva;
}

export interface CreateEventoRequest {
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  allDay: boolean;
  tipoEventoId: number;
  inscricaoAtiva: boolean;
  nomeFormulario?: ENomeFormulario | null;
  nivelCompartilhamento: ENivelCompartilhamento;
  recorrencia?: ERecorrencia;
  fimRecorrencia?: string | null;
  novaSala?: {
    descricao: string;
    tipoDeSalaId: number;
    dataInicio: string;
    dataFim: string;
    allDay: boolean;
  } | null;
  interessadoId?: number | null;
  reserva?: {
    valorTotal: number,
    valorSinal: number,
    dataVencimentoSinal: string | null,
    quantidadeParticipantes: number,
    observacoes: string | null,
    parcelas: {
      id: number,
      numeroParcela: number,
      valor: number,
      dataVencimento: string,
      isSinal: boolean,
    }[] | null,
  } | null;
}

export interface CreateSalaRequest {
  descricao: string;
  dataInicio: string;
  dataFim: string;
  allDay: boolean;
  tipoDeSalaId: number;
  status: EStatusReserva; // Obrigatório
}

export interface UpdateSalaRequest {
  id: number;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  allDay: boolean;
  tipoDeSalaId: number;
  status: EStatusReserva; // Corrigido: agora é EStatusReserva
  dataCriacao: string;
}

export interface FichaInscricao {
  id: number;
  eventoId: number;
  nome: string;
  sexo: string;
  dataNascimento: string;
  profissao: string | null;
  naturalidade: string | null;
  email: string;
  telefone: string;
  cep: string | null;
  estado: string | null;
  cidade: string | null;
  endereco: string | null;
  bairro: string | null;
  numero: string | null;
  complemento: string | null;
  estadoCivil: string | null;
  rg: string | null;
  cpf: string | null;
  nomeMae: string;
  maeFalecida: boolean;
  nascimentoMae: string | null;
  naturalidadeMae: string | null;
  estadoCivilMae: string | null;
  profissaoMae: string | null;
  mesmoEnderecoMae: boolean;
  nomePai: string;
  paiFalecido: boolean;
  nascimentoPai: string | null;
  naturalidadePai: string | null;
  estadoCivilPai: string | null;
  profissaoPai: string | null;
  mesmoEnderecoPai: boolean;
  evento: Evento;
}
