import { httpAuth, getToken } from '../http';
import { Usuario, UpdateUsuarioRequest } from './usuarios.types';

/**
 * GET /api/Usuarios/ListarUsuarios
 */
export async function listarUsuarios(): Promise<Usuario[]> {
  const token = getToken();
  return httpAuth<Usuario[]>('/api/Usuarios/ListarUsuarios', {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}

/**
 * PUT /api/Usuarios/AtualizarUsuario/:email
 */
export async function atualizarUsuario(data: UpdateUsuarioRequest): Promise<Usuario> {
  const token = getToken();
  return httpAuth<Usuario>(`/api/Usuarios/AtualizarUsuario/${encodeURIComponent(data.email)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}
