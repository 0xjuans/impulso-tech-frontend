import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import {
  CommunityPost,
  CommunityPostDetail,
  CommunityReply,
} from './community.dto';
import { CommunityService } from './community.service';

/**
 * Pruebas del servicio HTTP de comunidad (RF-034).
 *
 * <p>Cada prueba verifica que la URL, el método HTTP y los parámetros
 * enviados por el servicio coincidan exactamente con lo que espera el
 * backend en {@code /api/community}. Al hacerlo se garantiza que un
 * cambio de contrato en el backend se detecte tempranamente sin
 * necesidad de arrancar toda la aplicación.</p>
 */
describe('CommunityService', () => {
  let service: CommunityService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/community`;

  const samplePost: CommunityPost = {
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

  const sampleReply: CommunityReply = {
    id: 10,
    postId: 1,
    authorId: 43,
    authorName: 'Luis Torres',
    content: 'Usa HttpInterceptor',
    codeSnippet: null,
    helpfulCount: 2,
    accepted: false,
    createdAt: '2026-09-01T13:00:00Z',
    updatedAt: '2026-09-01T13:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CommunityService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CommunityService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('listPosts', () => {
    it('envía page y size por defecto cuando no se pasan filtros', () => {
      service.listPosts().subscribe();

      const req = http.expectOne(
        (r) => r.url === `${baseUrl}/posts` && r.method === 'GET',
      );
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      expect(req.request.params.has('search')).toBeFalse();
      expect(req.request.params.has('relatedType')).toBeFalse();
      req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
    });

    it('propaga todos los filtros suministrados', () => {
      service
        .listPosts({
          search: 'ng http',
          relatedType: 'CURSO',
          relatedId: 5,
          authorId: 3,
          page: 2,
          size: 10,
        })
        .subscribe();

      const req = http.expectOne(
        (r) => r.url === `${baseUrl}/posts` && r.method === 'GET',
      );
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('search')).toBe('ng http');
      expect(req.request.params.get('relatedType')).toBe('CURSO');
      expect(req.request.params.get('relatedId')).toBe('5');
      expect(req.request.params.get('authorId')).toBe('3');
      req.flush({ content: [samplePost], page: 2, size: 10, totalElements: 1, totalPages: 1 });
    });

    it('no incluye search cuando llega vacío', () => {
      service.listPosts({ search: '' }).subscribe();
      const req = http.expectOne(`${baseUrl}/posts?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
    });
  });

  describe('getPost', () => {
    it('llama al endpoint de detalle y devuelve el DTO anidado', (done) => {
      const detail: CommunityPostDetail = { post: samplePost, replies: [sampleReply] };
      service.getPost(1).subscribe((r) => {
        expect(r).toEqual(detail);
        expect(r.post.title).toBe(samplePost.title);
        done();
      });
      const req = http.expectOne(`${baseUrl}/posts/1`);
      expect(req.request.method).toBe('GET');
      req.flush(detail);
    });
  });

  describe('createPost', () => {
    it('hace POST con el payload y devuelve la publicación creada', (done) => {
      const payload = {
        title: 'Nueva',
        description: 'Descripción',
        codeSnippet: null,
        tags: 'a,b',
        relatedType: null,
        relatedId: null,
      };
      service.createPost(payload).subscribe((r) => {
        expect(r).toEqual(samplePost);
        done();
      });
      const req = http.expectOne(`${baseUrl}/posts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(samplePost);
    });
  });

  describe('deletePost', () => {
    it('envía DELETE al endpoint del post indicado', () => {
      service.deletePost(5).subscribe();
      const req = http.expectOne(`${baseUrl}/posts/5`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('createReply', () => {
    it('hace POST al endpoint de respuestas del post', (done) => {
      const payload = { content: 'una respuesta', codeSnippet: null };
      service.createReply(1, payload).subscribe((r) => {
        expect(r).toEqual(sampleReply);
        done();
      });
      const req = http.expectOne(`${baseUrl}/posts/1/replies`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(sampleReply);
    });
  });

  describe('deleteReply', () => {
    it('envía DELETE a la respuesta indicada', () => {
      service.deleteReply(9).subscribe();
      const req = http.expectOne(`${baseUrl}/replies/9`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('toggleHelpful', () => {
    it('hace POST al endpoint helpful de la respuesta', (done) => {
      const updated: CommunityReply = { ...sampleReply, helpfulCount: 3 };
      service.toggleHelpful(10).subscribe((r) => {
        expect(r.helpfulCount).toBe(3);
        done();
      });
      const req = http.expectOne(`${baseUrl}/replies/10/helpful`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(updated);
    });
  });

  describe('acceptReply', () => {
    it('hace POST al endpoint de aceptación con post y reply', (done) => {
      const accepted: CommunityPost = { ...samplePost, acceptedReplyId: 10 };
      service.acceptReply(1, 10).subscribe((r) => {
        expect(r.acceptedReplyId).toBe(10);
        done();
      });
      const req = http.expectOne(`${baseUrl}/posts/1/accepted-reply/10`);
      expect(req.request.method).toBe('POST');
      req.flush(accepted);
    });
  });

  describe('clearAcceptedReply', () => {
    it('hace DELETE al endpoint accepted-reply del post', (done) => {
      service.clearAcceptedReply(1).subscribe((r) => {
        expect(r.acceptedReplyId).toBeNull();
        done();
      });
      const req = http.expectOne(`${baseUrl}/posts/1/accepted-reply`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ ...samplePost, acceptedReplyId: null });
    });
  });

  describe('reportPost / reportReply', () => {
    it('reporta una publicación con la razón indicada', () => {
      service.reportPost(1, { reason: 'spam' }).subscribe();
      const req = http.expectOne(`${baseUrl}/posts/1/reports`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ reason: 'spam' });
      req.flush(null);
    });

    it('reporta una respuesta con la razón indicada', () => {
      service.reportReply(10, { reason: 'ofensivo' }).subscribe();
      const req = http.expectOne(`${baseUrl}/replies/10/reports`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ reason: 'ofensivo' });
      req.flush(null);
    });
  });
});
