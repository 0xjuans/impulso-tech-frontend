import { Injectable } from '@angular/core';

import { AuthResponse } from '../models/auth.dto';
import { User } from '../models/user.model';

/** Datos persistidos en el navegador para la sesión del usuario. */
interface StoredSession {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly expiresAt: string;
  readonly user: User;
}

const STORAGE_KEY = 'impulso.auth.session';

/**
 * Persiste la sesión autenticada en el almacenamiento local del
 * navegador.
 *
 * El almacenamiento en {@link localStorage} permite que la sesión
 * sobreviva a recargas y a pestañas nuevas del mismo dominio. Nunca se
 * guarda información sensible más allá del token JWT emitido por el
 * backend, y cualquier manipulación local del contenido no otorga
 * privilegios adicionales al usuario: el backend valida el token en cada
 * petición y toma la decisión final.
 */
@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  /**
   * Guarda una nueva sesión reemplazando la anterior si existía.
   *
   * @param auth respuesta emitida por la API tras un login exitoso.
   */
  save(auth: AuthResponse): void {
    const session: StoredSession = {
      accessToken: auth.accessToken,
      tokenType: auth.tokenType,
      expiresAt: auth.expiresAt,
      user: auth.user,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // El navegador puede estar en modo privado o sin cuota disponible.
      // La sesión seguirá viviendo en memoria a través de AuthService.
    }
  }

  /** Recupera la sesión almacenada o `null` si no existe o es inválida. */
  read(): StoredSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as StoredSession;
      if (!parsed.accessToken || !parsed.user) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  /** Elimina cualquier sesión previamente almacenada. */
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorado por las mismas razones que en {@link save}.
    }
  }
}
