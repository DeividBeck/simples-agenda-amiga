
import React from 'react';
import { useParams } from 'react-router-dom';
import { FichaBatismoForm } from '@/components/FichaBatismoForm';
import { useEventoBySlugPublico } from '@/hooks/useApi';
import { ENomeFormulario } from '@/types/api';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Inscricao = () => {
  const { filial, slug } = useParams<{ filial: string; slug: string }>();
  const { data: evento, isLoading, error } = useEventoBySlugPublico(parseInt(filial || '0'), slug || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Evento não encontrado</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              O link de inscrição que você está tentando acessar não existe ou expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!evento.inscricaoAtiva) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Inscrições encerradas</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              As inscrições para este evento não estão mais ativas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderizar formulário baseado no tipo
  switch (evento.nomeFormulario) {
    case ENomeFormulario.PreparacaoBatismo:
      return <FichaBatismoForm 
        eventoId={evento.id} 
        eventoTitulo={evento.titulo}
        filialNome={evento.filial?.nome}
        filialId={evento.filialId}
        empresaId={evento.filial?.empresaId || 1} // Usar empresaId da filial
      />;
    
    default:
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="max-w-md mx-auto w-full">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Formulário não disponível</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                O formulário para este evento ainda não foi configurado.
              </p>
            </CardContent>
          </Card>
        </div>
      );
  }
};

export default Inscricao;
