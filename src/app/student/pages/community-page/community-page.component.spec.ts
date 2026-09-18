import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { CommunityPost } from '../../../core/api/community/community.dto';
import { CommunityPageComponent } from './community-page.component';

/**
 * Pruebas del componente contenedor del foro de comunidad (RF-034).
 *
 * <p>Cubre el flujo básico observable por el usuario: carga inicial del
 * listado, aplicación de filtros, apertura del composer, publicación de
 * una nueva pregunta y manejo de errores en las llamadas al backend.</p>
 */
describe('CommunityPageComponent', () => {
  let fixture: ComponentFixture<CommunityPageComponent>;
  let component: CommunityPageComponent;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/community`;

  const post: CommunityPost = {
    id: 1,
    authorId: 42,
    authorName: 'Ana Rueda',
    title: 'Cómo hacer HTTP interceptor',
    description: '¿Cuál es la mejor forma?',
    codeSnippet: null,
    tags: 'angular, http',
    relatedType: 'CURSO',
    relatedId: 7,
    acceptedReplyId: null,
    createdAt: '2026-09-01T12:00:00Z',
    updatedAt: '2026-09-01T12:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommunityPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushInitialLoad(posts: CommunityPost[] = [post]): void {
    const req = http.expectOne((r) => r.url === `${baseUrl}/posts` && r.method === 'GET');
    req.flush({ content: posts, page: 0, size: 30, totalElements: posts.length, totalPages: 1 });
  }

  it('carga las publicaciones al iniciar', () => {
    fixture.detectChanges();
    flushInitialLoad();

    expect(component['loading']()).toBeFalse();
    expect(component['posts']().length).toBe(1);
    expect(component['posts']()[0].title).toBe('Cómo hacer HTTP interceptor');
  });

  it('muestra mensaje de error si la carga inicial falla', () => {
    fixture.detectChanges();
    const req = http.expectOne(`${baseUrl}/posts?page=0&size=30`);
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(component['error']()).toContain('No pudimos cargar');
    expect(component['posts']().length).toBe(0);
  });

  it('propaga los filtros al hacer apply', () => {
    fixture.detectChanges();
    flushInitialLoad();

    component['search'].set('http');
    component['relatedTypeFilter'].set('CURSO');
    component['apply']();

    const req = http.expectOne(
      (r) => r.url === `${baseUrl}/posts` && r.params.get('search') === 'http',
    );
    expect(req.request.params.get('relatedType')).toBe('CURSO');
    req.flush({ content: [], page: 0, size: 30, totalElements: 0, totalPages: 0 });
  });

  it('no permite enviar la publicación cuando faltan título o descripción', () => {
    fixture.detectChanges();
    flushInitialLoad();

    component['toggleComposer']();
    expect(component['canSubmit']()).toBeFalse();

    component['newTitle'].set('Solo título');
    expect(component['canSubmit']()).toBeFalse();

    component['newDescription'].set('Con descripción');
    expect(component['canSubmit']()).toBeTrue();
  });

  it('publica y agrega la nueva publicación al inicio del listado', () => {
    fixture.detectChanges();
    flushInitialLoad([]);

    component['toggleComposer']();
    component['newTitle'].set('Nueva pregunta');
    component['newDescription'].set('Contenido');
    component['newTags'].set('a, b');
    component['newRelatedType'].set('CURSO');
    component['submit']();

    const req = http.expectOne(`${baseUrl}/posts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      title: 'Nueva pregunta',
      description: 'Contenido',
      codeSnippet: null,
      tags: 'a, b',
      relatedType: 'CURSO',
    });
    const created = { ...post, id: 99, title: 'Nueva pregunta' };
    req.flush(created);

    // Tras la creacion, el componente dispara un reload adicional para
    // reflejar el orden real del backend. Respondemos con la lista que
    // incluye el nuevo elemento y verificamos que se renderiza en el DOM.
    const reloadReq = http.expectOne(
      (r) => r.url === `${baseUrl}/posts` && r.method === 'GET',
    );
    reloadReq.flush({
      content: [created],
      page: 0,
      size: 30,
      totalElements: 1,
      totalPages: 1,
    });

    expect(component['posts']()[0].id).toBe(99);
    expect(component['composerOpen']()).toBeFalse();
    expect(component['newTitle']()).toBe('');

    fixture.detectChanges();
    const rendered = fixture.nativeElement as HTMLElement;
    const titles = Array.from(rendered.querySelectorAll('.post__title')).map((el) =>
      el.textContent?.trim(),
    );
    expect(titles).toContain('Nueva pregunta');
    expect(rendered.querySelector('.community__empty')).toBeNull();
  });

  it('muestra error si la publicación falla y no borra el borrador', () => {
    fixture.detectChanges();
    flushInitialLoad([]);

    component['toggleComposer']();
    component['newTitle'].set('X');
    component['newDescription'].set('Y');
    component['submit']();

    const req = http.expectOne(`${baseUrl}/posts`);
    req.flush(
      { message: 'El título es obligatorio.' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(component['submitError']()).toBe('El título es obligatorio.');
    expect(component['newTitle']()).toBe('X');
    expect(component['newDescription']()).toBe('Y');
    expect(component['submitting']()).toBeFalse();
  });

  it('renderiza en el DOM las publicaciones cargadas', () => {
    fixture.detectChanges();
    flushInitialLoad();
    fixture.detectChanges();

    const rendered = fixture.nativeElement as HTMLElement;
    const cards = rendered.querySelectorAll('.post');
    expect(cards.length).toBe(1);
    expect(cards[0].querySelector('.post__title')?.textContent).toContain(
      'Cómo hacer HTTP interceptor',
    );
    expect(cards[0].querySelector('.post__author')?.textContent).toContain('Ana Rueda');
  });

  it('muestra la vista vacía cuando el backend responde sin publicaciones', () => {
    fixture.detectChanges();
    flushInitialLoad([]);
    fixture.detectChanges();

    const rendered = fixture.nativeElement as HTMLElement;
    expect(rendered.querySelector('.community__empty')).not.toBeNull();
    expect(rendered.querySelectorAll('.post').length).toBe(0);
  });

  it('convierte tags CSV en arreglo limpio ignorando espacios', () => {
    fixture.detectChanges();
    flushInitialLoad();

    expect(component['tagList'](post)).toEqual(['angular', 'http']);
    expect(component['tagList']({ ...post, tags: null })).toEqual([]);
    expect(component['tagList']({ ...post, tags: ' a ,,  b ' })).toEqual(['a', 'b']);
  });
});
