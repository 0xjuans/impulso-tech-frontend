import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Lab, LabRequest } from '../../../core/api/labs/lab.dto';
import { LabsService } from '../../../core/api/labs/labs.service';
import { ContentStatus } from '../../../core/api/learning-routes/learning-route.dto';
import {
  ContentContextPickerComponent,
  ContentContextValue,
} from '../../../shared/components/content-context-picker/content-context-picker.component';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';

/**
 * Editor de laboratorios (RF-053).
 *
 * <p>Funciona en modo creación ({@code /instructor/labs/new}) y edición
 * ({@code /instructor/labs/:id}). El backend usa {@code PUT} sobre el
 * mismo {@code LabRequest} para actualizar, por lo que el payload de
 * ambos casos es idéntico.</p>
 */
@Component({
  selector: 'app-instructor-lab-editor-page',
  standalone: true,
  imports: [FormsModule, RouterLink, RichTextEditorComponent, ContentContextPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-lab-editor-page.component.html',
  styleUrl: './instructor-lab-editor-page.component.scss',
})
export class InstructorLabEditorPageComponent implements OnInit {
  private readonly service = inject(LabsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly labId = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly loaded = signal<Lab | null>(null);

  protected readonly title = signal('');
  protected readonly description = signal('');
  protected readonly instructions = signal('');
  protected readonly language = signal('');
  protected readonly starterCode = signal('');
  protected readonly expectedOutput = signal('');
  protected readonly status = signal<ContentStatus>('BORRADOR');
  protected readonly courseId = signal<number | null>(null);
  protected readonly lessonId = signal<number | null>(null);

  protected readonly statuses: readonly ContentStatus[] = [
    'BORRADOR',
    'PUBLICADO',
    'DESHABILITADO',
  ];

  protected readonly isEditing = computed(() => this.labId() !== null);

  /** Vista agregada para el context-picker (sin ruta ni módulo). */
  protected readonly contextValue = computed<ContentContextValue>(() => ({
    learningRouteId: null,
    courseId: this.courseId(),
    moduleId: null,
    lessonId: this.lessonId(),
  }));

  protected readonly canSubmit = computed(
    () =>
      this.title().trim().length > 0 &&
      this.description().trim().length > 0 &&
      this.instructions().trim().length > 0 &&
      this.language().trim().length > 0,
  );

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      const id = Number(idParam);
      if (!Number.isFinite(id)) {
        this.error.set('El laboratorio solicitado no existe.');
        return;
      }
      this.labId.set(id);
      this.load(id);
    }
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .get(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (lab) => {
          this.loaded.set(lab);
          this.hydrate(lab);
        },
        error: () =>
          this.error.set('No pudimos cargar el laboratorio. Puede haber sido eliminado.'),
      });
  }

  private hydrate(l: Lab): void {
    this.title.set(l.title);
    this.description.set(l.description);
    this.instructions.set(l.instructions);
    this.language.set(l.language);
    this.starterCode.set(l.starterCode ?? '');
    this.expectedOutput.set(l.expectedOutput ?? '');
    this.status.set(l.status);
    this.courseId.set(l.courseId);
    this.lessonId.set(l.lessonId);
  }

  protected onContextChange(value: ContentContextValue): void {
    this.courseId.set(value.courseId);
    this.lessonId.set(value.lessonId);
  }

  protected submit(): void {
    if (!this.canSubmit() || this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    const id = this.labId();
    const payload = this.buildPayload();
    const request$ = id !== null ? this.service.update(id, payload) : this.service.create(payload);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.loaded.set(saved);
        if (id === null) void this.router.navigate(['/instructor/labs', saved.id]);
      },
      error: (err) => {
        const message = (err?.error?.message as string | undefined) ?? null;
        this.saveError.set(
          message ?? 'No pudimos guardar los cambios. Revisa los datos e inténtalo nuevamente.',
        );
      },
    });
  }

  private buildPayload(): LabRequest {
    return {
      title: this.title().trim(),
      description: this.description().trim(),
      instructions: this.instructions().trim(),
      language: this.language().trim(),
      starterCode: this.starterCode().trim() || null,
      expectedOutput: this.expectedOutput().trim() || null,
      courseId: this.courseId(),
      lessonId: this.lessonId(),
      status: this.status(),
    };
  }
}
