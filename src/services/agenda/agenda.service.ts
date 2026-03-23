import { http } from '../http';
import {
  Evento,
  Sala,
  TipoEvento,
  TipoDeSala,
  Interessado,
  Reserva,
  FichaInscricao,
  CreateEventoRequest,
  CreateSalaRequest,
  ReservaDto,
  StatusSala,
} from '@/types/api';
import { FilialData, TipoEventoGlobal, CreateReservaDto } from './agenda.types';

// ===================== EVENTOS =====================

export async function getEventos(filial: number, queryParams: string = ''): Promise<Evento[]> {
  return http<Evento[]>(`/${filial}/Eventos${queryParams}`);
}

export async function getEventosPublicos(filial: number): Promise<Evento[]> {
  return http<Evento[]>(`/${filial}/Eventos/Publicos`);
}

export async function getEventosDiocese(filial: number, dioceseId: number): Promise<Evento[]> {
  return http<Evento[]>(`/${filial}/Eventos/Diocese/${dioceseId}`);
}

export async function getEventosParoquia(filial: number, dioceseId: number, paroquiaId: number): Promise<Evento[]> {
  return http<Evento[]>(`/${filial}/Eventos/Paroquia/${dioceseId}/${paroquiaId}`);
}

export async function getEvento(filial: number, id: number): Promise<Evento> {
  return http<Evento>(`/${filial}/Eventos/${id}`);
}

export async function getEventoBySlug(filial: number, slug: string): Promise<Evento> {
  return http<Evento>(`/${filial}/Eventos/Slug/${slug}`);
}

export async function getEventoBySlugPublico(filial: number, slug: string): Promise<Evento> {
  return http<Evento>(`/${filial}/Eventos/publico/${slug}`);
}

export async function createEvento(filial: number, data: any): Promise<Evento> {
  return http<Evento>(`/${filial}/Eventos`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEvento(filial: number, id: number, data: any, scope?: number): Promise<any> {
  const queryParam = scope !== undefined ? `?scope=${scope}` : '';
  return http<any>(`/${filial}/Eventos/${id}${queryParam}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEvento(filial: number, id: number, scope?: number): Promise<any> {
  const queryParam = scope !== undefined ? `?scope=${scope}` : '';
  return http<any>(`/${filial}/Eventos/${id}${queryParam}`, {
    method: 'DELETE',
  });
}

// ===================== SALAS =====================

export async function getSalas(filial: number): Promise<Sala[]> {
  return http<Sala[]>(`/${filial}/Salas`);
}

export async function getSala(filial: number, id: number): Promise<Sala> {
  return http<Sala>(`/${filial}/Salas/${id}`);
}

export async function createSala(filial: number, data: any): Promise<any> {
  return http<any>(`/${filial}/Salas`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSala(filial: number, id: number, data: any): Promise<any> {
  return http<any>(`/${filial}/Salas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getSalasPendentes(filial: number): Promise<StatusSala[]> {
  return http<StatusSala[]>(`/${filial}/Salas/Pendentes`);
}

export async function updateSalaStatus(filial: number, id: number, status: number): Promise<any> {
  return http<any>(`/${filial}/Salas/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function deleteSala(filial: number, id: number): Promise<any> {
  return http<any>(`/${filial}/Salas/${id}`, {
    method: 'DELETE',
  });
}

// ===================== TIPOS DE EVENTOS =====================

export async function getTiposEventos(filial: number): Promise<TipoEvento[]> {
  return http<TipoEvento[]>(`/${filial}/TiposEventos`);
}

export async function createTipoEvento(filial: number, data: Omit<TipoEvento, 'id'>): Promise<any> {
  return http<any>(`/${filial}/TiposEventos`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTipoEvento(filial: number, id: number, data: TipoEvento): Promise<any> {
  return http<any>(`/${filial}/TiposEventos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTipoEvento(filial: number, id: number): Promise<any> {
  return http<any>(`/${filial}/TiposEventos/${id}`, {
    method: 'DELETE',
  });
}

// ===================== TIPOS DE SALAS =====================

export async function getTiposDeSalas(filial: number): Promise<TipoDeSala[]> {
  return http<TipoDeSala[]>(`/${filial}/TiposDeSalas`);
}

export async function createTipoDeSala(filial: number, data: Omit<TipoDeSala, 'id' | 'dataCriacao' | 'dataAtualizacao'>): Promise<any> {
  return http<any>(`/${filial}/TiposDeSalas`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTipoDeSala(filial: number, id: number, data: TipoDeSala): Promise<any> {
  return http<any>(`/${filial}/TiposDeSalas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTipoDeSala(filial: number, id: number): Promise<any> {
  return http<any>(`/${filial}/TiposDeSalas/${id}`, {
    method: 'DELETE',
  });
}

// ===================== TIPOS EVENTO GLOBAL =====================

export async function getTiposEventoGlobal(filial: number): Promise<TipoEventoGlobal[]> {
  return http<TipoEventoGlobal[]>(`/${filial}/TiposEventoGlobal`);
}

// ===================== INTERESSADOS =====================

export async function getInteressados(filial: number): Promise<Interessado[]> {
  return http<Interessado[]>(`/${filial}/Interessados`);
}

export async function getInteressado(filial: number, id: number): Promise<Interessado> {
  return http<Interessado>(`/${filial}/Interessados/${id}`);
}

export async function createInteressado(filial: number, data: Omit<Interessado, 'id'>): Promise<Interessado> {
  return http<Interessado>(`/${filial}/Interessados`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInteressado(filial: number, id: number, data: Interessado): Promise<any> {
  return http<any>(`/${filial}/Interessados/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteInteressado(filial: number, id: number): Promise<any> {
  return http<any>(`/${filial}/Interessados/${id}`, {
    method: 'DELETE',
  });
}

// ===================== RESERVAS =====================

export async function getReservas(filial: number): Promise<Reserva[]> {
  return http<Reserva[]>(`/${filial}/Reservas`);
}

export async function getReserva(filial: number, id: number): Promise<Reserva> {
  return http<Reserva>(`/${filial}/Reservas/${id}`);
}

export async function createReserva(filial: number, data: CreateReservaDto): Promise<any> {
  return http<any>(`/${filial}/Reservas`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateReserva(filial: number, id: number, data: ReservaDto): Promise<any> {
  return http<any>(`/${filial}/Reservas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ===================== INSCRIÇÕES =====================

export async function getInscricoesEvento(filial: number, eventoId: number): Promise<FichaInscricao[]> {
  return http<FichaInscricao[]>(`/${filial}/FichaInscricaoBatismos/Evento/${eventoId}`);
}

export async function createInscricaoBatismo(filialId: number, data: any): Promise<any> {
  return http<any>(`/${filialId}/FichaInscricaoBatismos`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ===================== FILIAL =====================

export async function getFilialData(filial: number): Promise<FilialData> {
  return http<FilialData>(`/${filial}/Filial`);
}

export async function updateFilialData(filial: number, data: FilialData): Promise<any> {
  return http<any>(`/${filial}/Filial`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
