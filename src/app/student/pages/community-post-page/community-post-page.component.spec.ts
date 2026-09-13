import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';

import { environment } from '../../../../environments/environment';
import {
  CommunityPost,
  CommunityPostDetail,
  CommunityReply,
} from '../../../core/api/community/community.dto';
import { AuthService } from '../../../core/auth/services/auth.service';
import { User } from '../../../core/auth/models/user.model';
import { CommunityPostPageComponent } from './community-post-page.component';

/**
 * Pruebas del componente de detalle de publicación (RF-034).
 *
 * <p>Se verifica el ciclo de carga por id, la ordenación de respuestas
 * poniendo la aceptada primero, la publicación de una respuesta nueva
 * y los flujos de acciones que dependen del rol del usuario autenticado
 * (marcar útil, aceptar respuesta, eliminar contenido propio).</p>
 */
describe('CommunityPostPageComponent', () => {
  let fixture: ComponentFixture<CommunityPostPageComponent>;
  let component: CommunityPostPageComponent;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/community`;

  const author: User = {
    id: 42,
    email: 'ana@impulso.tech',
    username: 'ana',
    firstName: 'Ana',
    lastName: 'Rueda',
    profilePhotoUrl: null,
    role: 'ESTUDIANTE',
    status: 'ACTIVA',
    emailVerifiedAt: '2026-08-01T00:00:00Z',
    createdAt: '2026-08-01T00:00:00Z',
  };

  const otherUser: User = { ...author, id: 99, username: 'otro', firstName: 'Otro' };

  const replyA: CommunityReply = {
    id: 10,
    postId: 1,
    authorId: 43,
    authorName: 'Luis Torres',
    content: 'Primera respuesta',
    codeSnippet: null,
    helpfulCount: 1,
    accepted: false,
    createdAt: '2026-09-01T13:00:00Z',
    updatedAt: '2026-09-01T13:00:00Z',
  };

  const replyB: CommunityReply = {
    id: 11,
    postId: 1,
    authorId: 44,
    authorName: 'María Peña',
    content: 'Segunda respuesta',
    codeSnippet: null,
    helpfulCount: 5,
    accepted: true,
    createdAt: '2026-09-02T13:00:00Z',
    updatedAt: '2026-09-02T13:00:00Z',
  };

  const postSummary: CommunityPost = {
    id: 1,
    authorId: author.id,
    authorName: 'Ana Rueda',
    title: 'Cómo hacer HTTP interceptor',
    description: '¿Cuál es la mejor forma?',
    codeSnippet: null,
    tags: 'angular, http',
    relatedType: 'CURSO',
    relatedId: 7,
    acceptedReplyId: replyB.id,
    createdAt: '2026-09-01T12:00:00Z',
    updatedAt: '2026-09-01T12:00:00Z',
  };

  const detail: CommunityPostDetail = {
    post: postSummary,
    replies: [replyA, replyB],
  };

  /** Stub mínimo de AuthService que expone el usuario configurado. */
  function authStub(user: User | null): Partial<AuthService> {
    const s = signal<User | null>(user);
    return { currentUser: s.asReadonly() } as Partial<AuthService>;
  }

  async function setup(idParam: string | null, user: User | null = author): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [CommunityPostPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authStub(user) },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (k: string) => (k === 'id' ? idParam : null) } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommunityPostPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  it('carga el detalle a partir del id de la ruta', async () => {
    await setup('1');
    fixture.detectChanges();

    const req = http.expectOne(`${baseUrl}/posts/1`);
    expect(req.request.method).toBe('GET');
    req.flush(detail);

    expect(component['loading']()).toBeFalse();
    expect(component['post']()?.title).toBe('Cómo hacer HTTP interceptor');
  });

  it('marca error si el id de la ruta no es numérico', async () => {
    await setup('abc');
    fixture.detectChanges();

    expect(component['error']()).toContain('no existe');
    expect(component['loading']()).toBeFalse();
    http.expectNone(`${baseUrl}/posts/abc`);
  });

  it('ordena las respuestas dejando la aceptada primero', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/posts/1`).flush(detail);

    const ordered = component['orderedReplies']();
    expect(ordered[0].id).toBe(replyB.id);
    expect(ordered[1].id).toBe(replyA.id);
  });

  it('publica una respuesta y la agrega al detalle', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/posts/1`).flush(detail);

    component['replyContent'].set('Otra respuesta');
    component['submitReply']();

    const req = http.expectOne(`${baseUrl}/posts/1/replies`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'Otra respuesta', codeSnippet: null });
    const nueva: CommunityReply = { ...replyA, id: 20, content: 'Otra respuesta' };
    req.flush(nueva);

    expect(component['detail']()!.replies.length).toBe(3);
    expect(component['detail']()!.replies[2].id).toBe(20);
    expect(component['replyContent']()).toBe('');
  });

  it('no envía la respuesta cuando el contenido está vacío', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/posts/1`).flush(detail);

    component['replyContent'].set('   ');
    component['submitReply']();

    http.expectNone(`${baseUrl}/posts/1/replies`);
    expect(component['submitting']()).toBeFalse();
  });

  it('marca una respuesta como útil actualizando el contador', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/posts/1`).flush(detail);

    component['toggleHelpful'](replyA);
    const req = http.expectOne(`${baseUrl}/replies/${replyA.id}/helpful`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...replyA, helpfulCount: 2 });

    const updated = component['detail']()!.replies.find((r) => r.id === replyA.id);
    expect(updated?.helpfulCount).toBe(2);
  });

  it('permite al autor aceptar una respuesta y refleja acceptedReplyId', async () => {
    await setup('1', author);
    fixture.detectChanges();
    http
      .expectOne(`${baseUrl}/posts/1`)
      .flush({ post: { ...postSummary, acceptedReplyId: null }, replies: [replyA] });

    expect(component['isPostAuthor']()).toBeTrue();
    component['toggleAccepted'](replyA);

    const req = http.expectOne(`${baseUrl}/posts/1/accepted-reply/${replyA.id}`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...postSummary, acceptedReplyId: replyA.id });

    expect(component['post']()!.acceptedReplyId).toBe(replyA.id);
    expect(component['detail']()!.replies[0].accepted).toBeTrue();
  });

  it('ignora aceptar respuesta si el usuario no es el autor', async () => {
    await setup('1', otherUser);
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/posts/1`).flush(detail);

    component['toggleAccepted'](replyA);
    http.expectNone(`${baseUrl}/posts/1/accepted-reply/${replyA.id}`);
    expect(component['isPostAuthor']()).toBeFalse();
  });

  it('elimina la publicación tras confirmación y navega al listado', async () => {
    await setup('1', author);
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/posts/1`).flush(detail);

    spyOn(window, 'confirm').and.returnValue(true);
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component['deletePost']();
    const req = http.expectOne(`${baseUrl}/posts/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(navSpy).toHaveBeenCalledWith(['/student/community']);
  });

  it('no elimina si el usuario cancela la confirmación', async () => {
    await setup('1', author);
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/posts/1`).flush(detail);

    const confirmSpy = spyOn(window, 'confirm').and.returnValue(false);
    component['deletePost']();

    expect(confirmSpy).toHaveBeenCalled();
    http.expectNone((r) => r.method === 'DELETE');
  });
});
