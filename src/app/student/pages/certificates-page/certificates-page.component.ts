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
import {
  CertificatesService,
  PendingCertificate,
} from '../../../core/api/certificates/certificates.service';

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

  /** Cursos completados con certificado activo sin emitir todavía. */
  protected readonly pending = signal<readonly PendingCertificate[]>([]);

  /** Curso cuya emisión está en curso, si aplica. */
  protected readonly claimingId = signal<number | null>(null);

  /** Mensaje de resultado del último intento de reclamo. */
  protected readonly claimMessage = signal<{ tone: 'ok' | 'error'; text: string } | null>(null);

  protected readonly hasCertificates = computed(() => this.certificates().length > 0);
  protected readonly hasPending = computed(() => this.pending().length > 0);

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
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
    this.refreshPending();
  }

  private refreshPending(): void {
    this.service
      .listPending()
      .pipe(catchError(() => of([] as readonly PendingCertificate[])))
      .subscribe((list) => this.pending.set(list));
  }

  /**
   * Reclama el certificado de un curso completado. Al confirmarse, el
   * curso se retira de "pendientes" y aparece en la lista principal.
   */
  protected claim(row: PendingCertificate): void {
    if (this.claimingId()) return;
    this.claimingId.set(row.courseId);
    this.claimMessage.set(null);
    this.service.claim(row.courseId).subscribe({
      next: (cert) => {
        this.certificates.update((list) => [cert, ...list]);
        this.pending.update((list) => list.filter((p) => p.courseId !== row.courseId));
        this.claimingId.set(null);
        this.claimMessage.set({
          tone: 'ok',
          text: `Certificado emitido para "${row.courseName}".`,
        });
      },
      error: (err) => {
        this.claimingId.set(null);
        this.claimMessage.set({
          tone: 'error',
          text:
            err?.error?.message ??
            'No pudimos emitir el certificado. Verifica que hayas completado el curso.',
        });
      },
    });
  }

  protected downloadUrl(code: string): string {
    return this.service.downloadUrl(code);
  }

  protected verifyPath(code: string): string {
    return `/verify/${code}`;
  }
}
