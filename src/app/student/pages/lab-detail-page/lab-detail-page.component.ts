import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import {
  ExecutionResult,
  Lab,
  LabSubmission,
} from '../../../core/api/labs/lab.dto';
import { LabsService } from '../../../core/api/labs/labs.service';

/**
 * Detalle de un laboratorio para el estudiante (RF-053).
 *
 * <p>Renderiza las instrucciones del laboratorio y ofrece dos
 * acciones: <em>Probar</em> (ejecuta el código en el sandbox sin
 * persistir) y <em>Enviar</em> (persiste la entrega). Muestra el
 * resultado de la última ejecución (stdout, stderr, exit code, tiempo)
 * y el historial de entregas propias.</p>
 */
@Component({
  selector: 'app-student-lab-detail-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lab-detail-page.component.html',
  styleUrl: './lab-detail-page.component.scss',
})
export class LabDetailPageComponent implements OnInit {
  private readonly service = inject(LabsService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly lab = signal<Lab | null>(null);
  protected readonly submissions = signal<readonly LabSubmission[]>([]);

  protected readonly code = signal('');
  protected readonly stdin = signal('');
  protected readonly runResult = signal<ExecutionResult | null>(null);
  protected readonly running = signal(false);
  protected readonly submitting = signal(false);
  protected readonly runError = signal<string | null>(null);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submitOk = signal<string | null>(null);

  protected readonly canRun = computed(() => this.code().trim().length > 0);

  protected readonly sortedSubmissions = computed(() =>
    [...this.submissions()].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    ),
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.error.set('El laboratorio solicitado no existe.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.service
      .get(id)
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar el laboratorio. Puede haber sido retirado.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((lab) => {
        this.lab.set(lab);
        if (lab) {
          if (lab.starterCode) this.code.set(lab.starterCode);
          this.loadSubmissions(id);
        }
      });
  }

  private loadSubmissions(id: number): void {
    this.service.listMySubmissions(id).subscribe({
      next: (list) => this.submissions.set(list),
      error: () => this.submissions.set([]),
    });
  }

  protected tryExecute(): void {
    const l = this.lab();
    if (!l || !this.canRun() || this.running()) return;
    this.running.set(true);
    this.runError.set(null);
    this.service
      .tryExecute(l.id, {
        code: this.code(),
        stdin: this.stdin().trim() || null,
      })
      .pipe(finalize(() => this.running.set(false)))
      .subscribe({
        next: (result) => this.runResult.set(result),
        error: (err) => {
          const message = (err?.error?.message as string | undefined) ?? null;
          this.runError.set(message ?? 'No pudimos ejecutar el código. Inténtalo nuevamente.');
        },
      });
  }

  protected submit(): void {
    const l = this.lab();
    if (!l || !this.canRun() || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.submitOk.set(null);
    this.service
      .submit(l.id, {
        code: this.code(),
        stdin: this.stdin().trim() || null,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (submission) => {
          this.submissions.update((list) => [submission, ...list]);
          this.submitOk.set('Tu entrega fue enviada correctamente.');
        },
        error: (err) => {
          const message = (err?.error?.message as string | undefined) ?? null;
          this.submitError.set(message ?? 'No pudimos enviar tu entrega. Inténtalo nuevamente.');
        },
      });
  }
}
