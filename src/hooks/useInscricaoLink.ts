
import { Evento } from '@/types/api';

export const useInscricaoLink = () => {
  const generateInscricaoLink = (evento: Evento): string | null => {
    if (!evento.inscricaoAtiva || !evento.slug || !evento.filialId) {
      return null;
    }

    const baseUrl = window.location.origin;
    return `${baseUrl}/agendaparoquial/inscricao/${evento.filialId}/${evento.slug}`;
  };

  const copyLinkToClipboard = async (link: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch (error) {
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  };

  return {
    generateInscricaoLink,
    copyLinkToClipboard,
  };
};
