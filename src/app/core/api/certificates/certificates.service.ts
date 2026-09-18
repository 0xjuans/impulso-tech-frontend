import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CertificateResponse, CertificateVerification } from './certificate.dto';

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
}
