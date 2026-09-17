import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
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
 * Catálogo de laboratorios publicados para el estudiante (RF-053).
 *
 * <p>Consume {@code /api/labs} filtrando por texto y lenguaje. El
 * backend expone solo laboratorios publicados a los estudiantes.</p>
 */
@Component({
  selector: 'app-student-labs-page',
  standalone: true,
  imports: [FormsModule, RouterLink, StripHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './labs-page.component.html',
  styleUrl: './labs-page.component.scss',
})
export class LabsPageComponent implements OnInit {
  private readonly service = inject(LabsService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly labs = signal<readonly Lab[]>([]);

  protected readonly q = signal('');
  protected readonly language = signal('');

  ngOnInit(): void {
    this.reload();
  }

  protected apply(): void {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .search({
        q: this.q().trim() || undefined,
        language: this.language().trim() || undefined,
        page: 0,
        size: 30,
      })
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar los laboratorios. Inténtalo nuevamente.');
          return of({ content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((res) => this.labs.set(res.content));
  }
}
