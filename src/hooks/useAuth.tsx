
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getToken,
  saveToken,
  removeToken,
  saveRefreshToken,
  saveTokenExpiration,
  decodeJwtPayload,
  isTokenExpired,
  getFilialSelecionada,
  saveFilialSelecionada,
  removeFilialSelecionada,
} from '@/services/http';

interface TokenData {
  Filiais?: string;
  Calendario?: string[];
  [key: string]: any;
  exp: number;
  iss: string;
  aud: string;
}

interface Filial {
  id: number;
  nome: string;
  cnpj: string;
  empresaId: number;
  empresaName: string;
}

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [filialSelecionada, setFilialSelecionada_] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isChangingFilial, setIsChangingFilial] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const authToken = getToken();

    if (authToken) {
      try {
        const payload = decodeJwtPayload<TokenData>(authToken);

        // Verificar se o token não está expirado
        if (isTokenExpired(authToken)) {
          removeToken();
          removeFilialSelecionada();
          setToken(null);
          setTokenData(null);
          setFiliais([]);
          setFilialSelecionada_(0);
          setIsInitialized(true);
          return;
        }

        setToken(authToken);
        setTokenData(payload);

        // Extrair filiais do token
        const filiaisExtraidas: Filial[] = [];

        if (payload.Filiais) {
          try {
            const filialArray = JSON.parse(payload.Filiais);
            filialArray.forEach((f: any) => {
              filiaisExtraidas.push({
                id: f.Id,
                nome: f.FilialName,
                cnpj: f.FilialCpfCnpj,
                empresaId: f.EmpresaId,
                empresaName: f.EmpresaName,
              });
            });
          } catch (e) {
            console.error('Erro ao parsear Filiais do token:', e);
          }
        } else {
          // Formato legado: Filial0, Filial1, etc.
          Object.keys(payload).forEach(key => {
            if (key.startsWith('Filial') && key !== 'Filiais') {
              const filialIndex = parseInt(key.replace('Filial', ''));
              const filialData = payload[key];
              if (Array.isArray(filialData) && filialData.length >= 2) {
                filiaisExtraidas.push({
                  id: filialIndex,
                  nome: filialData[0],
                  cnpj: filialData[1],
                  empresaId: payload.EmpresaId ? parseInt(payload.EmpresaId) : 0,
                  empresaName: payload.EmpresaName || '',
                });
              }
            }
          });
        }
        setFiliais(filiaisExtraidas);

        if (!isInitialized && filiaisExtraidas.length > 0) {
          const savedFilialId = getFilialSelecionada();
          if (filiaisExtraidas.some(f => f.id === savedFilialId)) {
            setFilialSelecionada_(savedFilialId);
          } else {
            setFilialSelecionada_(filiaisExtraidas[0].id);
            saveFilialSelecionada(filiaisExtraidas[0].id);
          }
        }
      } catch (error) {
        removeToken();
        removeFilialSelecionada();
        setToken(null);
        setTokenData(null);
      }
    } else {
      setToken(null);
      setTokenData(null);
      setFiliais([]);
      setFilialSelecionada_(0);
    }

    setIsInitialized(true);
  }, []);

  const isTokenValid = () => {
    if (!tokenData) return false;
    const now = Math.floor(Date.now() / 1000);
    return tokenData.exp > now;
  };

  const handleSetFilialSelecionada = async (filialId: number) => {
    if (filialId === filialSelecionada) return;

    setIsChangingFilial(true);
    try {
      setFilialSelecionada_(filialId);
      saveFilialSelecionada(filialId);
      queryClient.clear();
      await new Promise(resolve => setTimeout(resolve, 800));
      window.location.reload();
    } catch (error) {
      setIsChangingFilial(false);
    }
  };

  const logout = () => {
    removeToken();
    removeFilialSelecionada();
    setToken(null);
    setTokenData(null);
    setFiliais([]);
    setFilialSelecionada_(0);
    queryClient.clear();
  };

  return {
    token,
    tokenData,
    filiais,
    filialSelecionada,
    setFilialSelecionada: handleSetFilialSelecionada,
    isAuthenticated: !!token && isTokenValid(),
    isTokenValid,
    isChangingFilial,
    isInitialized,
    logout
  };
};
