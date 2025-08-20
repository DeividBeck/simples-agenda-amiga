export interface TipoEvento {
  id: number;
  nome: string;
  cor: string;
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

export enum EStatusReserva {
  Pendente = 0,
  Aprovado = 1,
  Rejeitado = 2,
  Cancelado = 3
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
