
import { useAuth } from './useAuth';

interface ClaimsData {
  Calendario?: string[] | string;
  Autenticacao?: string[] | string;
  [key: string]: string[] | string | any;
}

export const useClaims = () => {
  const { tokenData } = useAuth();

  const getClaims = (): ClaimsData => {
    if (!tokenData) return {};

    // Extrair claims do token
    const claims: ClaimsData = {};
    Object.keys(tokenData).forEach(key => {
      // Verificar se é array ou string única (para claims únicos)
      if (Array.isArray(tokenData[key]) && typeof tokenData[key][0] === 'string' && !key.startsWith('Filial')) {
        claims[key] = tokenData[key];
      } else if (typeof tokenData[key] === 'string' && !key.startsWith('Filial') &&
        !['sub', 'email', 'name', 'jti', 'iss', 'aud', 'EmpresaId', 'EmpresaName'].includes(key)) {
        // Para claims únicos, converter string para array
        claims[key] = [tokenData[key]];
      }
    });
    return claims;
  };

  const hasAutenticacaoClaim = (action: string): boolean => {
    const claims = getClaims();
    const autenticacaoClaims = claims.Autenticacao || [];

    // Garantir que sempre seja tratado como array
    const claimsArray = Array.isArray(autenticacaoClaims) ? autenticacaoClaims : [autenticacaoClaims];

    // Se o usuário tiver a claim 'Admin' em Calendario, tem acesso total
    if (hasCalendarioClaim('Admin')) {
      return true;
    }

    return claimsArray.includes(action);
  };

  const hasCalendarioClaim = (action: string): boolean => {
    const claims = getClaims();
    const calendarioClaims = claims.Calendario || [];

    // Garantir que sempre seja tratado como array
    const claimsArray = Array.isArray(calendarioClaims) ? calendarioClaims : [calendarioClaims];

    // Se o usuário tiver a claim 'Admin', ele tem acesso total (bypass nas outras verificações)
    if (claimsArray.includes('Admin')) {
      return true;
    }

    const hasClaim = claimsArray.includes(action);
    return hasClaim;
  };

  // Claims para eventos
  const canReadEventos = () => hasCalendarioClaim('EventoLer');
  const canCreateEventos = () => hasCalendarioClaim('EventoCriar');
  const canEditEventos = () => hasCalendarioClaim('EventoEditar');
  const canDeleteEventos = () => hasCalendarioClaim('EventoExcluir');

  // Claims para salas
  const canReadSalas = () => hasCalendarioClaim('SalaLer');
  const canCreateSalas = () => hasCalendarioClaim('SalaCriar');
  const canEditSalas = () => hasCalendarioClaim('SalaEditar');
  const canDeleteSalas = () => hasCalendarioClaim('SalaExcluir');
  const canApproveSalas = () => hasCalendarioClaim('SalaAprovar');

  // Claims para tipos de eventos - Adicionando edição e exclusão
  const canReadTiposEventos = () => hasCalendarioClaim('TipoEventoLer');
  const canCreateTiposEventos = () => hasCalendarioClaim('TipoEventoCriar');
  const canEditTiposEventos = () => hasCalendarioClaim('TipoEventoEditar');
  const canDeleteTiposEventos = () => hasCalendarioClaim('TipoEventoExcluir');

  // Claims para tipos de salas - Adicionando edição e exclusão
  const canReadTiposSalas = () => hasCalendarioClaim('TipoSalaLer');
  const canCreateTiposSalas = () => hasCalendarioClaim('TipoSalaCriar');
  const canEditTiposSalas = () => hasCalendarioClaim('TipoSalaEditar');
  const canDeleteTiposSalas = () => hasCalendarioClaim('TipoSalaExcluir');

  // Claims para contratantes - Adicionando leitura, criação, edição e exclusão
  const canReadContratantes = () => hasCalendarioClaim('ContratanteLer');
  const canCreateContratantes = () => hasCalendarioClaim('ContratanteCriar');
  const canEditContratantes = () => hasCalendarioClaim('ContratanteEditar');
  const canDeleteContratantes = () => hasCalendarioClaim('ContratanteExcluir');

  // Claims para reservas
  const canReadReservas = () => hasCalendarioClaim('ReservaLer');
  const canCreateReservas = () => hasCalendarioClaim('ReservaCriar');
  const canEditReservas = () => hasCalendarioClaim('ReservaEditar');
  const canDeleteReservas = () => hasCalendarioClaim('ReservaExcluir');

  // Verificar se é administrador (tem a claim específica de Admin)
  const isAdmin = () => {
    return hasCalendarioClaim('Admin');
  };

  // Claims para usuários (módulo Autenticacao)
  const canListUsuarios = () => hasAutenticacaoClaim('ListarUsuario');

  return {
    getClaims,
    hasCalendarioClaim,
    hasAutenticacaoClaim,
    canReadEventos,
    canCreateEventos,
    canEditEventos,
    canDeleteEventos,
    canReadSalas,
    canCreateSalas,
    canEditSalas,
    canDeleteSalas,
    canApproveSalas,
    canReadTiposEventos,
    canCreateTiposEventos,
    canEditTiposEventos,
    canDeleteTiposEventos,
    canReadTiposSalas,
    canCreateTiposSalas,
    canEditTiposSalas,
    canDeleteTiposSalas,
    canReadContratantes,
    canCreateContratantes,
    canEditContratantes,
    canDeleteContratantes,
    canReadReservas,
    canCreateReservas,
    canEditReservas,
    canDeleteReservas,
    canListUsuarios,
    isAdmin
  };
};
