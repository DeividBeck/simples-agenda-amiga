
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface TokenData {
  EmpresaId: string;
  EmpresaName: string;
  Calendario?: string[]; // Claims do calendário
  [key: string]: any; // Para capturar Filial0, Filial1, etc.
  exp: number;
  iss: string;
  aud: string;
}

interface Filial {
  id: number;
  nome: string;
  cnpj: string;
}

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [filialSelecionada, setFilialSelecionada] = useState<number>(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isChangingFilial, setIsChangingFilial] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');

    if (authToken) {
      try {
        // Decodificar o JWT com suporte a UTF-8
        const base64Url = authToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);

        setToken(authToken);
        setTokenData(payload);

        // Extrair filiais do token
        const filiaisExtraidas: Filial[] = [];
        Object.keys(payload).forEach(key => {
          if (key.startsWith('Filial')) {
            const filialIndex = parseInt(key.replace('Filial', ''));
            const filialData = payload[key];

            if (Array.isArray(filialData) && filialData.length >= 2) {
              filiaisExtraidas.push({
                id: filialIndex,
                nome: filialData[0],
                cnpj: filialData[1]
              });
            }
          }
        });
        setFiliais(filiaisExtraidas);

        // Só definir filial selecionada automaticamente se ainda não foi inicializado
        // e se há filiais disponíveis
        if (!isInitialized && filiaisExtraidas.length > 0) {
          // Verificar se há uma filial salva no localStorage
          const savedFilial = localStorage.getItem('filialSelecionada');
          if (savedFilial) {
            const savedFilialId = parseInt(savedFilial);
            // Verificar se a filial salva existe nas filiais extraídas
            if (filiaisExtraidas.some(f => f.id === savedFilialId)) {
              setFilialSelecionada(savedFilialId);
            } else {
              // Se a filial salva não existe, usar a primeira
              setFilialSelecionada(filiaisExtraidas[0].id);
              localStorage.setItem('filialSelecionada', filiaisExtraidas[0].id.toString());
            }
          } else {
            // Se não há filial salva, usar a primeira
            setFilialSelecionada(filiaisExtraidas[0].id);
            localStorage.setItem('filialSelecionada', filiaisExtraidas[0].id.toString());
          }
        }
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('filialSelecionada');
        setToken(null);
        setTokenData(null);
      }
    } else {
      setToken(null);
      setTokenData(null);
      setFiliais([]);
      setFilialSelecionada(1);
    }

    setIsInitialized(true);
  }, [isInitialized]);

  const isTokenValid = () => {
    if (!tokenData) return false;
    const now = Math.floor(Date.now() / 1000);
    return tokenData.exp > now;
  };

  const handleSetFilialSelecionada = async (filialId: number) => {

    // Mostrar loading
    setIsChangingFilial(true);

    try {
      // Atualizar estado e localStorage
      setFilialSelecionada(filialId);
      localStorage.setItem('filialSelecionada', filialId.toString());

      // Aguardar um momento para mostrar o loading
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fazer refresh da página para garantir que todos os dados sejam recarregados
      window.location.reload();

    } catch (error) {
      // Em caso de erro, esconder loading
      setIsChangingFilial(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('filialSelecionada');
    setToken(null);
    setTokenData(null);
    setFiliais([]);
    setFilialSelecionada(1);
    setIsInitialized(false);
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
    logout
  };
};
