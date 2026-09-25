import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CertificateResponse, CertificateVerification } from './certificate.dto';

/**
 * Curso que el usuario ha completado y para el cual aún no se ha
 * emitido su certificado (RF-047).
 */
export interface PendingCertificate {
  readonly courseId: number;
  readonly courseName: string;
  readonly completedAt: string;
}

/**
 * Servicio HTTP que consume los endpoints de certificados del backend
 * (RF-047).
 *
 * <p>La verificación por código y la descarga del PDF son endpoints
 * públicos, no requieren autenticación. El listado privado del
 * estudiante sí requiere el JWT y usa el prefijo {@code /users/me}.</p>
 */
@Injectable({ providedIn: 'root' })
export class CertificatesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Certificados obtenidos por el usuario autenticado. */
  listMine(): Observable<readonly CertificateResponse[]> {
    return this.http.get<readonly CertificateResponse[]>(`${this.baseUrl}/users/me/certificates`);
  }

  /** Verificación pública por código UUID. */
  verify(code: string): Observable<CertificateVerification> {
    return this.http.get<CertificateVerification>(`${this.baseUrl}/certificates/${code}`);
  }

  /**
   * URL absoluta a la descarga del PDF. Se usa como {@code href} directo
   * en un {@code <a download>} para que el navegador maneje el flujo
   * sin necesidad de blobs intermedios.
   */
  downloadUrl(code: string): string {
    return `${this.baseUrl}/certificates/${code}/download`;
  }

  /**
   * Lista los cursos que el estudiante ya completó y para los que aún
   * no se ha emitido el certificado. Se usan en la sección
   * "Pendientes por reclamar" del panel.
   */
  listPending(): Observable<readonly PendingCertificate[]> {
    return this.http.get<readonly PendingCertificate[]>(
      `${this.baseUrl}/users/me/certificates/pending`,
    );
  }

  /**
   * Emite (o recupera) el certificado del curso indicado. Idempotente:
   * si ya existía uno emitido, se devuelve el mismo sin duplicarlo.
   */
  claim(courseId: number): Observable<CertificateResponse> {
    return this.http.post<CertificateResponse>(
      `${this.baseUrl}/users/me/certificates/course/${courseId}`,
      {},
    );
  }
}
