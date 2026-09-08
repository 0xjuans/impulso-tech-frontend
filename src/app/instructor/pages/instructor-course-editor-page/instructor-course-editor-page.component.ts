import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';

import { ContentStatus } from '../../../core/api/learning-routes/learning-route.dto';
import {
  Course,
  CourseModule,
  UpdateCourseRequest,
} from '../../../core/api/courses/course.dto';
import { CoursesService } from '../../../core/api/courses/courses.service';
import { Lesson } from '../../../core/api/lessons/lesson.dto';
import { LessonsService } from '../../../core/api/lessons/lessons.service';

/** Estado de un módulo en el árbol interactivo. */
interface ModuleNode {
  readonly module: CourseModule;
  expanded: boolean;
  loadingLessons: boolean;
  lessons: readonly Lesson[];
  newLessonTitle: string;
  newLessonOptional: boolean;
  editing: boolean;
  draftName: string;
  draftDescription: string;
  draftOptional: boolean;
}

/**
 * Editor completo de un curso (RF-040, RF-041).
 *
 * Combina el formulario de edición del curso con la gestión inline de
 * sus módulos y lecciones para permitir al instructor construir el
 * contenido sin cambiar de página.
 */
@Component({
  selector: 'app-instructor-course-editor-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-course-editor-page.component.html',
  styleUrl: './instructor-course-editor-page.component.scss',
})
export class InstructorCourseEditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly coursesService = inject(CoursesService);
  private readonly lessonsService = inject(LessonsService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly course = signal<Course | null>(null);
  protected readonly modules = signal<readonly ModuleNode[]>([]);

  protected readonly saving = signal(false);
  protected readonly saveMessage = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);

  /** Borrador del formulario del curso. */
  protected readonly form = signal<UpdateCourseRequest>({});

  protected readonly newModuleName = signal('');
  protected readonly newModuleOptional = signal(false);
  protected readonly creatingModule = signal(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const courseId = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(courseId)) {
      this.error.set('Curso no válido.');
      this.loading.set(false);
      return;
    }

    this.coursesService
      .get(courseId)
      .pipe(
        switchMap((course) =>
          forkJoin({
            course: of(course),
            modules: this.coursesService.listModules(course.id).pipe(catchError(() => of([]))),
          }),
        ),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ course, modules }) => {
          this.course.set(course);
          this.form.set(this.buildFormDraft(course));
          this.modules.set(modules.map((m) => this.toNode(m)));
        },
        error: () =>
          this.error.set(
            'No pudimos cargar el curso en este momento. Inténtalo nuevamente.',
          ),
      });
  }

  protected updateForm<K extends keyof UpdateCourseRequest>(
    key: K,
    value: UpdateCourseRequest[K],
  ): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  protected save(): void {
    const course = this.course();
    if (!course || this.saving()) return;
    this.saving.set(true);
    this.saveMessage.set(null);
    this.saveError.set(null);
    this.coursesService
      .update(course.id, this.form())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          this.course.set(updated);
          this.form.set(this.buildFormDraft(updated));
          this.saveMessage.set('Cambios guardados.');
        },
        error: () =>
          this.saveError.set('No pudimos guardar los cambios. Inténtalo nuevamente.'),
      });
  }

  protected changeCourseStatus(status: ContentStatus): void {
    const course = this.course();
    if (!course || course.status === status) return;
    this.coursesService.changeStatus(course.id, status).subscribe({
      next: (updated) => this.course.set(updated),
    });
  }

  // Módulos ---------------------------------------------------------------

  protected toggleModule(node: ModuleNode): void {
    if (node.expanded) {
      this.updateNode(node.module.id, { expanded: false });
      return;
    }
    this.updateNode(node.module.id, { expanded: true, loadingLessons: true });
    this.lessonsService.listByModule(node.module.id).subscribe({
      next: (lessons) =>
        this.updateNode(node.module.id, { lessons, loadingLessons: false }),
      error: () => this.updateNode(node.module.id, { loadingLessons: false }),
    });
  }

  protected startEditingModule(node: ModuleNode): void {
    this.updateNode(node.module.id, {
      editing: true,
      draftName: node.module.name,
      draftDescription: node.module.description ?? '',
      draftOptional: node.module.optional,
    });
  }

  protected cancelModuleEdit(node: ModuleNode): void {
    this.updateNode(node.module.id, { editing: false });
  }

  protected saveModule(node: ModuleNode): void {
    if (!node.draftName.trim()) return;
    this.coursesService
      .updateModule(node.module.id, {
        name: node.draftName.trim(),
        description: node.draftDescription.trim() || null,
        optional: node.draftOptional,
      })
      .subscribe({
        next: (module) => this.updateNode(module.id, { module, editing: false }),
      });
  }

  protected changeModuleStatus(node: ModuleNode, status: ContentStatus): void {
    if (node.module.status === status) return;
    this.coursesService.changeModuleStatus(node.module.id, status).subscribe({
      next: (module) => this.updateNode(module.id, { module }),
    });
  }

  protected deleteModule(node: ModuleNode): void {
    if (!confirm(`¿Eliminar el módulo "${node.module.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.coursesService.deleteModule(node.module.id).subscribe({
      next: () =>
        this.modules.update((list) => list.filter((n) => n.module.id !== node.module.id)),
    });
  }

  protected createModule(): void {
    const course = this.course();
    const name = this.newModuleName().trim();
    if (!course || !name || this.creatingModule()) return;
    this.creatingModule.set(true);
    this.coursesService
      .createModule(course.id, { name, optional: this.newModuleOptional() })
      .pipe(finalize(() => this.creatingModule.set(false)))
      .subscribe({
        next: (module) => {
          this.modules.update((list) => [...list, this.toNode(module)]);
          this.newModuleName.set('');
          this.newModuleOptional.set(false);
        },
      });
  }

  // Lecciones -------------------------------------------------------------

  protected updateNewLesson(node: ModuleNode, key: 'newLessonTitle' | 'newLessonOptional', value: string | boolean): void {
    this.updateNode(node.module.id, { [key]: value } as Partial<ModuleNode>);
  }

  protected createLesson(node: ModuleNode): void {
    const title = node.newLessonTitle.trim();
    if (!title) return;
    this.lessonsService
      .create(node.module.id, { title, optional: node.newLessonOptional })
      .subscribe({
        next: (lesson) => {
          this.updateNode(node.module.id, {
            lessons: [...node.lessons, lesson],
            newLessonTitle: '',
            newLessonOptional: false,
          });
        },
      });
  }

  protected changeLessonStatus(node: ModuleNode, lesson: Lesson, status: ContentStatus): void {
    if (lesson.status === status) return;
    this.lessonsService.changeStatus(lesson.id, status).subscribe({
      next: (updated) =>
        this.updateNode(node.module.id, {
          lessons: node.lessons.map((l) => (l.id === updated.id ? updated : l)),
        }),
    });
  }

  protected deleteLesson(node: ModuleNode, lesson: Lesson): void {
    if (!confirm(`¿Eliminar la lección "${lesson.title}"?`)) return;
    this.lessonsService.delete(lesson.id).subscribe({
      next: () =>
        this.updateNode(node.module.id, {
          lessons: node.lessons.filter((l) => l.id !== lesson.id),
        }),
    });
  }

  // Utilidades ------------------------------------------------------------

  private updateNode(moduleId: number, patch: Partial<ModuleNode>): void {
    this.modules.update((list) =>
      list.map((n) => (n.module.id === moduleId ? { ...n, ...patch } : n)),
    );
  }

  private toNode(module: CourseModule): ModuleNode {
    return {
      module,
      expanded: false,
      loadingLessons: false,
      lessons: [],
      newLessonTitle: '',
      newLessonOptional: false,
      editing: false,
      draftName: module.name,
      draftDescription: module.description ?? '',
      draftOptional: module.optional,
    };
  }

  private buildFormDraft(course: Course): UpdateCourseRequest {
    return {
      name: course.name,
      description: course.description,
      objective: course.objective,
      coverImageUrl: course.coverImageUrl,
      difficulty: course.difficulty,
      estimatedDurationHours: course.estimatedDurationHours,
      technology: course.technology,
      generatesCertificate: course.generatesCertificate,
    };
  }
}
