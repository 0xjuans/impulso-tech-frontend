import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';

/** Datos de cada diapositiva del tour. */
export interface TourSlide {
  title: string;
  items: string[];
}

/**
 * Componente de tour interactivo con reproducción automática.
 *
 * Presenta una secuencia de diapositivas animadas que describen las
 * funcionalidades del perfil. Se comporta como un reproductor de video
 * con controles de play/pausa, barra de progreso y navegación manual
 * por diapositiva.
 */
@Component({
  selector: 'app-tour-video',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tour-video.component.html',
  styleUrl: './tour-video.component.scss',
})
export class TourVideoComponent implements OnInit, OnDestroy {
  @Input({ required: true }) slides: TourSlide[] = [];
  @Input({ required: true }) accentColor = '#e8734a';
  @Input({ required: true }) role = '';
  @Input() subtitle = '';

  protected readonly currentIndex = signal(0);
  protected readonly playing = signal(false);
  protected readonly progress = signal(0);
  protected readonly showIntro = signal(true);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly SLIDE_DURATION = 5000;
  private readonly TICK = 50;
  private elapsed = 0;

  private containerRef = viewChild<ElementRef<HTMLElement>>('container');

  ngOnInit(): void {
    this.play();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.hidden) {
      this.pause();
    }
  }

  protected play(): void {
    if (this.intervalId) return;
    this.playing.set(true);
    this.showIntro.set(false);
    this.intervalId = setInterval(() => this.tick(), this.TICK);
  }

  protected pause(): void {
    this.playing.set(false);
    this.stop();
  }

  protected togglePlay(): void {
    if (this.playing()) {
      this.pause();
    } else {
      this.play();
    }
  }

  protected goTo(index: number): void {
    this.currentIndex.set(index);
    this.elapsed = 0;
    this.progress.set(0);
  }

  protected next(): void {
    const nextIdx = (this.currentIndex() + 1) % this.slides.length;
    this.goTo(nextIdx);
  }

  protected prev(): void {
    const prevIdx = (this.currentIndex() - 1 + this.slides.length) % this.slides.length;
    this.goTo(prevIdx);
  }

  protected globalProgress(): number {
    const total = this.slides.length;
    if (total === 0) return 0;
    return ((this.currentIndex() + this.progress() / 100) / total) * 100;
  }

  private tick(): void {
    this.elapsed += this.TICK;
    this.progress.set(Math.min((this.elapsed / this.SLIDE_DURATION) * 100, 100));
    if (this.elapsed >= this.SLIDE_DURATION) {
      this.elapsed = 0;
      this.progress.set(0);
      const nextIdx = this.currentIndex() + 1;
      if (nextIdx >= this.slides.length) {
        this.currentIndex.set(0);
        this.pause();
      } else {
        this.currentIndex.set(nextIdx);
      }
    }
  }

  private stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
