export interface UsuarioAcesso {
  modulo: string;
  acesso: string;
}

export interface Usuario {
  email: string;
  nome: string;
  acessos: UsuarioAcesso[];
}

export interface UpdateUsuarioRequest {
  email: string;
  nome: string;
  acessos: UsuarioAcesso[];
}
