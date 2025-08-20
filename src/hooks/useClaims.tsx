
import { useAuth } from './useAuth';

interface ClaimsData {
  Calendario?: string[] | string;
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

  const hasCalendarioClaim = (action: string): boolean => {
    const claims = getClaims();
    const calendarioClaims = claims.Calendario || [];

    // Garantir que sempre seja tratado como array
    const claimsArray = Array.isArray(calendarioClaims) ? calendarioClaims : [calendarioClaims];
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

  // Claims para tipos de eventos - CORRIGIDO: apenas leitura e criação
  const canReadTiposEventos = () => hasCalendarioClaim('TipoEventoLer');
  const canCreateTiposEventos = () => hasCalendarioClaim('TipoEventoCriar');

  // Claims para tipos de salas - CORRIGIDO: apenas leitura e criação
  const canReadTiposSalas = () => hasCalendarioClaim('TipoSalaLer');
  const canCreateTiposSalas = () => hasCalendarioClaim('TipoSalaCriar');

  return {
    getClaims,
    hasCalendarioClaim,
    canReadEventos,
    canCreateEventos,
    canEditEventos,
    canDeleteEventos,
    canReadSalas,
    canCreateSalas,
    canEditSalas,
    canDeleteSalas,
    canReadTiposEventos,
    canCreateTiposEventos,
    canReadTiposSalas,
    canCreateTiposSalas
  };
};
