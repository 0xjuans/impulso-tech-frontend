import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { Course, CourseModule } from '../../../core/api/courses/course.dto';
import { CoursesService } from '../../../core/api/courses/courses.service';
import { LearningRoute } from '../../../core/api/learning-routes/learning-route.dto';
import { LearningRoutesService } from '../../../core/api/learning-routes/learning-routes.service';
import { Lesson } from '../../../core/api/lessons/lesson.dto';
import { LessonsService } from '../../../core/api/lessons/lessons.service';

/**
 * Contexto educativo al que se asocia un contenido (reto, proyecto,
 * recurso, evaluación...). Todos los campos son opcionales; se emiten
 * como {@code null} cuando el instructor deja el nivel sin seleccionar.
 */
export interface ContentContextValue {
  readonly learningRouteId: number | null;
  readonly courseId: number | null;
  readonly moduleId: number | null;
  readonly lessonId: number | null;
}

/**
 * Selector reutilizable de contexto educativo (ruta, curso, módulo y
 * lección) con selectores en cascada que muestran <em>nombres reales</em>
 * en lugar de exigir ids sueltos al instructor.
 *
 * <p>Está diseñado para reemplazar los inputs numéricos de
 * {@code learningRouteId}/{@code courseId}/{@code moduleId}/{@code lessonId}
 * en los editores de retos, proyectos y afines. La lección se puede
 * ocultar con {@code [showLesson]="false"} cuando el contenido no la
 * requiere (por ejemplo, un proyecto asociado sólo a curso o módulo).</p>
 *
 * <p>El componente emite el valor mediante {@code (valueChange)} y
 * acepta un valor inicial vía {@code [value]}; sigue el patrón de
 * two-way binding con la sintaxis compacta {@code [(value)]}.</p>
 */
@Component({
  selector: 'app-content-context-picker',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content-context-picker.component.html',
  styleUrl: './content-context-picker.component.scss',
})
export class ContentContextPickerComponent implements OnInit, OnChanges {
  private readonly routesService = inject(LearningRoutesService);
  private readonly coursesService = inject(CoursesService);
  private readonly lessonsService = inject(LessonsService);

  /** Valor inicial y sincronización con el contenedor. */
  @Input() value: ContentContextValue = {
    learningRouteId: null,
    courseId: null,
    moduleId: null,
    lessonId: null,
  };

  /** Oculta el selector de lección cuando el modelo no la contempla. */
  @Input() showLesson = true;

  /**
   * Oculta el selector de ruta de aprendizaje cuando el modelo no la
   * necesita (por ejemplo laboratorios, que solo se relacionan con
   * curso y lección).
   */
  @Input() showRoute = true;

  /** Etiqueta opcional que aparece antes del grupo de selectores. */
  @Input() label = '';

  /** Se emite en cada cambio de cualquiera de los selectores. */
  @Output() readonly valueChange = new EventEmitter<ContentContextValue>();

  protected readonly routes = signal<readonly LearningRoute[]>([]);
  protected readonly courses = signal<readonly Course[]>([]);
  protected readonly modules = signal<readonly CourseModule[]>([]);
  protected readonly lessons = signal<readonly Lesson[]>([]);

  protected readonly loadingRoutes = signal(true);
  protected readonly loadingCourses = signal(true);
  protected readonly loadingModules = signal(false);
  protected readonly loadingLessons = signal(false);

  protected readonly routeId = signal<number | null>(null);
  protected readonly courseId = signal<number | null>(null);
  protected readonly moduleId = signal<number | null>(null);
  protected readonly lessonId = signal<number | null>(null);

  /**
   * Cursos filtrados por la ruta seleccionada, si hay una. Si no, se
   * muestran todos los cursos para que el instructor pueda asociar el
   * contenido a un curso independiente de cualquier ruta.
   */
  protected readonly filteredCourses = computed(() => {
    const rid = this.routeId();
    const list = this.courses();
    if (rid === null) return list;
    return list.filter((c) => c.learningRouteId === rid);
  });

  ngOnInit(): void {
    this.applyExternalValue(this.value);
    if (this.showRoute) this.loadRoutes();
    else this.loadingRoutes.set(false);
    this.loadCourses();
    if (this.courseId() !== null) this.loadModulesFor(this.courseId()!);
    if (this.moduleId() !== null) this.loadLessonsFor(this.moduleId()!);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && !changes['value'].firstChange) {
      this.applyExternalValue(this.value);
      if (this.courseId() !== null && this.modules().length === 0) {
        this.loadModulesFor(this.courseId()!);
      }
      if (this.moduleId() !== null && this.lessons().length === 0) {
        this.loadLessonsFor(this.moduleId()!);
      }
    }
  }

  private applyExternalValue(value: ContentContextValue): void {
    this.routeId.set(value.learningRouteId);
    this.courseId.set(value.courseId);
    this.moduleId.set(value.moduleId);
    this.lessonId.set(value.lessonId);
  }

  private loadRoutes(): void {
    this.loadingRoutes.set(true);
    this.routesService
      .listAllForManagement({ page: 0, size: 200 })
      .pipe(finalize(() => this.loadingRoutes.set(false)))
      .subscribe({
        next: (res) => this.routes.set(res.content),
        error: () => this.routes.set([]),
      });
  }

  private loadCourses(): void {
    this.loadingCourses.set(true);
    this.coursesService
      .listManaged({ page: 0, size: 200 })
      .pipe(finalize(() => this.loadingCourses.set(false)))
      .subscribe({
        next: (res) => this.courses.set(res.content),
        error: () => this.courses.set([]),
      });
  }

  private loadModulesFor(courseId: number): void {
    this.loadingModules.set(true);
    this.coursesService
      .listModules(courseId)
      .pipe(finalize(() => this.loadingModules.set(false)))
      .subscribe({
        next: (list) => this.modules.set(list),
        error: () => this.modules.set([]),
      });
  }

  private loadLessonsFor(moduleId: number): void {
    this.loadingLessons.set(true);
    this.lessonsService
      .listByModule(moduleId)
      .pipe(finalize(() => this.loadingLessons.set(false)))
      .subscribe({
        next: (list) => this.lessons.set(list),
        error: () => this.lessons.set([]),
      });
  }

  protected onRouteChange(id: number | null): void {
    this.routeId.set(id);
    // Al cambiar de ruta, se limpian curso/módulo/lección: la relación
    // pierde sentido si el curso previo pertenece a otra ruta.
    this.courseId.set(null);
    this.moduleId.set(null);
    this.lessonId.set(null);
    this.modules.set([]);
    this.lessons.set([]);
    this.emit();
  }

  protected onCourseChange(id: number | null): void {
    this.courseId.set(id);
    this.moduleId.set(null);
    this.lessonId.set(null);
    this.modules.set([]);
    this.lessons.set([]);
    if (id !== null) this.loadModulesFor(id);
    this.emit();
  }

  protected onModuleChange(id: number | null): void {
    this.moduleId.set(id);
    this.lessonId.set(null);
    this.lessons.set([]);
    if (id !== null) this.loadLessonsFor(id);
    this.emit();
  }

  protected onLessonChange(id: number | null): void {
    this.lessonId.set(id);
    this.emit();
  }

  private emit(): void {
    this.valueChange.emit({
      learningRouteId: this.routeId(),
      courseId: this.courseId(),
      moduleId: this.moduleId(),
      lessonId: this.lessonId(),
    });
  }
}
