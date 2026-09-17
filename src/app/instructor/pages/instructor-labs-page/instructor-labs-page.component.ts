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
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import { Lab } from '../../../core/api/labs/lab.dto';
import { LabsService } from '../../../core/api/labs/labs.service';
import { StripHtmlPipe } from '../../../shared/pipes/strip-html.pipe';

/**
 * Panel de gestión de laboratorios del instructor (RF-053).
 *
 * <p>Consume {@code /api/labs} con filtros de texto, lenguaje y curso.
 * El backend filtra automáticamente por rol: el instructor ve todos
 * los suyos, independientemente del estado.</p>
 */
@Component({
  selector: 'app-instructor-labs-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, StripHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-labs-page.component.html',
  styleUrl: './instructor-labs-page.component.scss',
})
export class InstructorLabsPageComponent implements OnInit {
  private readonly service = inject(LabsService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly labs = signal<readonly Lab[]>([]);

  protected readonly q = signal('');
  protected readonly language = signal('');
  protected readonly pendingDeleteId = signal<number | null>(null);

  protected readonly counts = computed(() => {
    const list = this.labs();
    return {
      total: list.length,
      published: list.filter((l) => l.status === 'PUBLICADO').length,
      draft: list.filter((l) => l.status === 'BORRADOR').length,
      disabled: list.filter((l) => l.status === 'DESHABILITADO').length,
    };
  });

  ngOnInit(): void {
    this.reload();
  }

  protected apply(): void {
    this.reload();
  }

  protected deleteLab(lab: Lab): void {
    const confirmed = window.confirm(
      `¿Eliminar el laboratorio "${lab.title}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    this.pendingDeleteId.set(lab.id);
    this.service
      .delete(lab.id)
      .pipe(finalize(() => this.pendingDeleteId.set(null)))
      .subscribe({
        next: () => this.labs.update((list) => list.filter((l) => l.id !== lab.id)),
        error: () =>
          this.error.set('No pudimos eliminar el laboratorio. Inténtalo nuevamente.'),
      });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .search({
        q: this.q().trim() || undefined,
        language: this.language().trim() || undefined,
        page: 0,
        size: 50,
      })
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar los laboratorios. Inténtalo nuevamente.');
          return of({ content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => this.labs.set(response.content));
  }
}
