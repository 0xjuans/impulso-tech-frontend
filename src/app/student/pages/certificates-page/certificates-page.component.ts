import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import { CertificateResponse } from '../../../core/api/certificates/certificate.dto';
import { CertificatesService } from '../../../core/api/certificates/certificates.service';

/**
 * Página del estudiante que lista sus certificados de finalización de
 * curso (RF-047).
 *
 * <p>Muestra por cada certificado el curso completado, la fecha de
 * emisión y las acciones de descarga en PDF y verificación pública.
 * La descarga se resuelve como un enlace directo al endpoint público
 * para aprovechar el manejo nativo del navegador.</p>
 */
@Component({
  selector: 'app-student-certificates-page',
  standalone: true,
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './certificates-page.component.html',
  styleUrl: './certificates-page.component.scss',
})
export class CertificatesPageComponent implements OnInit {
  private readonly service = inject(CertificatesService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly certificates = signal<readonly CertificateResponse[]>([]);

  protected readonly hasCertificates = computed(() => this.certificates().length > 0);

  ngOnInit(): void {
    this.loading.set(true);
    this.service
      .listMine()
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar tus certificados. Intenta nuevamente en unos segundos.');
          return of([] as readonly CertificateResponse[]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((list) => this.certificates.set(list));
  }

  protected downloadUrl(code: string): string {
    return this.service.downloadUrl(code);
  }

  protected verifyPath(code: string): string {
    return `/verify/${code}`;
  }
}
