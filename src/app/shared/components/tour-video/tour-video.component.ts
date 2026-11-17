import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/services/auth.service';
import { TourChapter } from './tour-chapters';

/** Pasos de la ventana de recorrido: invitación inicial o reproductor. */
type TourStep = 'welcome' | 'player';

/**
 * Recorrido guiado de la plataforma en una ventana de bienvenida.
 *
 * La primera vez que el usuario entra tras iniciar sesión se abre sola
 * con una invitación de Luki. Si acepta, se reproduce el video narrado
 * junto a una lista de capítulos: cada capítulo salta al momento del
 * video donde se explica esa sección y ofrece ir directamente a ella.
 *
 * Que el recorrido ya se mostró se recuerda en {@link localStorage} por
 * usuario; es solo una comodidad de interfaz y no afecta permisos. El
 * botón «Ver recorrido» permite reabrirlo en cualquier momento.
 */
@Component({
  selector: 'app-tour-video',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tour-video.component.html',
  styleUrl: './tour-video.component.scss',
})
export class TourVideoComponent implements OnInit {
  private readonly auth = inject(AuthService);

  /** Ruta del video MP4 del recorrido correspondiente al rol. */
  @Input({ required: true }) src = '';

  /** Identificador del recorrido (por rol), usado para recordar si ya se mostró. */
  @Input({ required: true }) tourId = '';

  /** Capítulos del video, ordenados por su segundo de inicio. */
  @Input({ required: true }) chapters: readonly TourChapter[] = [];

  private readonly player = viewChild<ElementRef<HTMLVideoElement>>('player');

  /** Indica si la ventana del recorrido está visible. */
  protected readonly open = signal(false);

  /** Paso actual dentro de la ventana. */
  protected readonly step = signal<TourStep>('welcome');

  /** Índice del capítulo que se está reproduciendo. */
  protected readonly currentIndex = signal(0);

  protected readonly currentChapter = computed(() => this.chapters[this.currentIndex()]);

  protected readonly firstName = computed(() => this.auth.currentUser()?.firstName ?? '');

  ngOnInit(): void {
    if (!this.wasSeen()) {
      this.open.set(true);
    }
  }

  /** Reabre el recorrido desde el botón de la página. */
  protected reopen(): void {
    this.step.set('welcome');
    this.open.set(true);
  }

  /** Pasa de la invitación al reproductor con capítulos. */
  protected start(): void {
    this.currentIndex.set(0);
    this.step.set('player');
  }

  /** Cierra la ventana y recuerda que el usuario ya vio la invitación. */
  protected close(): void {
    this.open.set(false);
    this.markSeen();
  }

  /** Salta el video al inicio del capítulo indicado y continúa la reproducción. */
  protected goTo(index: number): void {
    const video = this.player()?.nativeElement;
    const chapter = this.chapters[index];
    if (!video || !chapter) return;
    video.currentTime = chapter.start + 0.05;
    this.currentIndex.set(index);
    void video.play();
  }

  /** Mantiene resaltado el capítulo que corresponde al segundo actual del video. */
  protected onTimeUpdate(): void {
    const time = this.player()?.nativeElement.currentTime ?? 0;
    let index = 0;
    for (let i = 0; i < this.chapters.length; i++) {
      if (time >= this.chapters[i].start) index = i;
    }
    if (index !== this.currentIndex()) this.currentIndex.set(index);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.close();
  }

  private storageKey(): string {
    return `impulso.tour.seen.${this.tourId}.${this.auth.currentUser()?.id ?? 'anon'}`;
  }

  // El almacenamiento puede no estar disponible (modo privado, datos bloqueados);
  // en ese caso el recorrido simplemente se vuelve a ofrecer.
  private wasSeen(): boolean {
    try {
      return localStorage.getItem(this.storageKey()) === '1';
    } catch {
      return false;
    }
  }

  private markSeen(): void {
    try {
      localStorage.setItem(this.storageKey(), '1');
    } catch {
      /* sin almacenamiento disponible */
    }
  }
}
