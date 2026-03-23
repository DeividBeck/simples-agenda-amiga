import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, Loader2, FileText } from 'lucide-react';
import { useContratoPdf } from '@/hooks/api/useContrato';

interface ContratoModalProps {
    isOpen: boolean;
    onClose: () => void;
    reservaId: number | null;
}

export const ContratoModal: React.FC<ContratoModalProps> = ({ isOpen, onClose, reservaId }) => {
    const { data: pdfBlob, isLoading, isError, refetch } = useContratoPdf(reservaId);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        if (pdfBlob) {
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);

            // Limpa a URL da memória ao desmontar ou trocar o arquivo
            return () => URL.revokeObjectURL(url);
        }
    }, [pdfBlob]);

    const handleDownload = () => {
        if (pdfUrl && reservaId) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `contrato_reserva_${reservaId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handlePrint = () => {
        if (pdfUrl) {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = pdfUrl;
            document.body.appendChild(iframe);
            iframe.onload = () => {
                iframe.contentWindow?.print();
            };
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl w-[95vw] h-[90vh] flex flex-col p-4">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Visualização de Contrato (Reserva #{reservaId})
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 min-h-0 relative bg-muted/30 rounded-md border flex items-center justify-center mt-2 overflow-hidden">
                    {isLoading ? (
                        <div className="flex flex-col items-center text-muted-foreground gap-2">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span>Carregando documento...</span>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center text-destructive gap-2">
                            <span>Erro ao carregar o contrato. Certifique-se de que ele já foi gerado.</span>
                            <Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
                        </div>
                    ) : pdfUrl ? (
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full rounded-md border-0"
                            title={`Contrato Reserva ${reservaId}`}
                        />
                    ) : null}
                </div>

                <DialogFooter className="mt-4 flex gap-2 sm:gap-0 justify-between items-center w-full">
                    <Button variant="outline" onClick={onClose}>Fechar</Button>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} variant="secondary" disabled={!pdfUrl}>
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir
                        </Button>
                        <Button onClick={handleDownload} disabled={!pdfUrl} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};