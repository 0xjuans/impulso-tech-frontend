import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import { CertificateVerification } from '../../core/api/certificates/certificate.dto';
import { CertificatesService } from '../../core/api/certificates/certificates.service';

/**
 * Página pública de verificación de certificados (RF-047).
 *
 * <p>No requiere autenticación: consume el endpoint público
 * {@code GET /api/certificates/{code}}. Muestra los datos que acreditan
 * la validez del certificado y ofrece un enlace directo a la descarga
 * del PDF.</p>
 */
@Component({
  selector: 'app-verify-certificate-page',
  standalone: true,
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './verify-certificate-page.component.html',
  styleUrl: './verify-certificate-page.component.scss',
})
export class VerifyCertificatePageComponent implements OnInit {
  private readonly service = inject(CertificatesService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly certificate = signal<CertificateVerification | null>(null);
  protected readonly code = signal<string>('');

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code') ?? '';
    this.code.set(code);
    if (!code) {
      this.error.set('Código de verificación no suministrado.');
      this.loading.set(false);
      return;
    }
    this.service
      .verify(code)
      .pipe(
        catchError(() => {
          this.error.set('El código no corresponde a ningún certificado válido.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((cert) => this.certificate.set(cert));
  }

  protected downloadUrl(code: string): string {
    return this.service.downloadUrl(code);
  }
}
