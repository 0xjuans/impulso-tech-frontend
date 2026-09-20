import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MascotAvatarComponent, MascotState } from './mascot-avatar.component';

/**
 * Pruebas del {@link MascotAvatarComponent}.
 *
 * <p>Se verifica que cada estado semántico se traduce a la ilustración
 * correcta en {@code public/mascot/}, que los alias en inglés se mapean
 * al nombre canónico en español, y que el {@code alt} se actualiza con
 * información contextual para lectores de pantalla.</p>
 */
describe('MascotAvatarComponent', () => {
  let fixture: ComponentFixture<MascotAvatarComponent>;
  let component: MascotAvatarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MascotAvatarComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(MascotAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function img(): HTMLImageElement {
    return fixture.nativeElement.querySelector('img.mascot-avatar__pose');
  }

  function root(): HTMLElement {
    return fixture.nativeElement.querySelector('.mascot-avatar');
  }

  it('renderiza la pose idle por defecto', () => {
    expect(img().getAttribute('src')).toBe('mascot/idle.webp');
    expect(root().classList.contains('is-idle')).toBeTrue();
  });

  it('cambia la imagen y la clase de estado al asignar cada pose canónica', () => {
    const cases: [MascotState, string, string][] = [
      ['saludo', 'mascot/saludo.webp', 'is-saludo'],
      ['pensando', 'mascot/pensando.webp', 'is-pensando'],
      ['hablando', 'mascot/hablando.webp', 'is-hablando'],
      ['celebrando', 'mascot/celebrando.webp', 'is-celebrando'],
      ['confundido', 'mascot/confundido.webp', 'is-confundido'],
      ['felicitando', 'mascot/felicitando.webp', 'is-felicitando'],
      ['inactivo', 'mascot/inactivo.webp', 'is-inactivo'],
    ];
    for (const [state, expectedSrc, expectedClass] of cases) {
      component.state = state;
      fixture.detectChanges();
      expect(img().getAttribute('src'))
        .withContext(`estado ${state} debe cargar ${expectedSrc}`)
        .toBe(expectedSrc);
      expect(root().classList.contains(expectedClass))
        .withContext(`estado ${state} debe aplicar clase ${expectedClass}`)
        .toBeTrue();
    }
  });

  it('normaliza los alias en inglés a las poses en español', () => {
    const cases: [MascotState, string, string][] = [
      ['thinking', 'mascot/pensando.webp', 'is-pensando'],
      ['talking', 'mascot/hablando.webp', 'is-hablando'],
      ['happy', 'mascot/celebrando.webp', 'is-celebrando'],
    ];
    for (const [state, expectedSrc, expectedClass] of cases) {
      component.state = state;
      fixture.detectChanges();
      expect(img().getAttribute('src')).toBe(expectedSrc);
      expect(root().classList.contains(expectedClass)).toBeTrue();
    }
  });

  it('usa el basePath configurado para construir la URL de la imagen', () => {
    component.basePath = 'custom/route';
    component.state = 'saludo';
    fixture.detectChanges();
    expect(img().getAttribute('src')).toBe('custom/route/saludo.webp');
  });

  it('provee un texto alternativo descriptivo por pose', () => {
    component.state = 'felicitando';
    fixture.detectChanges();
    expect(img().getAttribute('alt')).toContain('pulgar');
  });

  it('acepta cambios de tamaño en tiempo de ejecución sin errores', () => {
    expect(() => {
      component.sizePx = 96;
      fixture.detectChanges();
    }).not.toThrow();
    expect(component.sizePx).toBe(96);
  });
});
