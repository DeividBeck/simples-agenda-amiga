
import { useState } from 'react';

interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
}

export const useCepSearch = () => {
  const [isLoading, setIsLoading] = useState(false);

  const searchCep = async (cep: string): Promise<CepData | null> => {
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return null;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchCep,
    isLoading
  };
};
