import { getToken } from '@/services/http';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const gerarContrato = async (filialId: number, reservaId: number): Promise<void> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/${filialId}/Reservas/${reservaId}/gerar-contrato`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Erro ao gerar contrato: ${errorText}`);
    }
};

export const getContratoPdf = async (filialId: number, reservaId: number): Promise<Blob> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/${filialId}/Reservas/${reservaId}/download-contrato`, {
        method: 'GET',
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    });

    if (!response.ok) {
        throw new Error('Erro ao baixar contrato');
    }

    return await response.blob();
};