import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../learning-routes/learning-route.dto';
import {
  CommunityPost,
  CommunityPostDetail,
  CommunityReply,
  CreatePostRequest,
  CreateReplyRequest,
  CreateReportRequest,
  RelatedContentType,
} from './community.dto';

/**
 * Servicio HTTP del módulo de comunidad y foro de aprendizaje (RF-034).
 *
 * <p>Encapsula las llamadas al backend en {@code /api/community}. Al
 * concentrar aquí las URLs y la construcción de {@code HttpParams} se
 * evita que cada componente conozca detalles de la API, facilitando
 * cambios futuros de rutas o parámetros.</p>
 */
@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/community`;

  /**
   * Lista publicaciones aplicando filtros opcionales. Los valores no
   * suministrados se omiten para que el backend devuelva todas las
   * publicaciones visibles al usuario.
   */
  listPosts(options: {
    search?: string;
    relatedType?: RelatedContentType;
    relatedId?: number;
    authorId?: number;
    page?: number;
    size?: number;
  } = {}): Observable<PagedResponse<CommunityPost>> {
    let params = new HttpParams()
      .set('page', options.page ?? 0)
      .set('size', options.size ?? 20);
    if (options.search) params = params.set('search', options.search);
    if (options.relatedType) params = params.set('relatedType', options.relatedType);
    if (options.relatedId != null) params = params.set('relatedId', options.relatedId);
    if (options.authorId != null) params = params.set('authorId', options.authorId);
    return this.http.get<PagedResponse<CommunityPost>>(`${this.baseUrl}/posts`, { params });
  }

  /** Recupera el detalle de una publicación con todas sus respuestas. */
  getPost(id: number): Observable<CommunityPostDetail> {
    return this.http.get<CommunityPostDetail>(`${this.baseUrl}/posts/${id}`);
  }

  /** Crea una nueva publicación. */
  createPost(payload: CreatePostRequest): Observable<CommunityPost> {
    return this.http.post<CommunityPost>(`${this.baseUrl}/posts`, payload);
  }

  /** Elimina una publicación propia o, para administradores, cualquiera. */
  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/${id}`);
  }

  /** Publica una respuesta en la publicación indicada. */
  createReply(postId: number, payload: CreateReplyRequest): Observable<CommunityReply> {
    return this.http.post<CommunityReply>(`${this.baseUrl}/posts/${postId}/replies`, payload);
  }

  /** Elimina una respuesta propia o, para administradores, cualquiera. */
  deleteReply(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/replies/${id}`);
  }

  /**
   * Alterna la marca "útil" del usuario autenticado sobre la respuesta.
   * El backend se encarga de registrarla si aún no existía o retirarla
   * si ya estaba marcada.
   */
  toggleHelpful(replyId: number): Observable<CommunityReply> {
    return this.http.post<CommunityReply>(`${this.baseUrl}/replies/${replyId}/helpful`, {});
  }

  /**
   * Marca una respuesta como la aceptada por el autor de la publicación.
   * Solo el autor original o un administrador pueden ejecutarla.
   */
  acceptReply(postId: number, replyId: number): Observable<CommunityPost> {
    return this.http.post<CommunityPost>(
      `${this.baseUrl}/posts/${postId}/accepted-reply/${replyId}`,
      {},
    );
  }

  /** Retira la marca de respuesta aceptada de la publicación. */
  clearAcceptedReply(postId: number): Observable<CommunityPost> {
    return this.http.delete<CommunityPost>(`${this.baseUrl}/posts/${postId}/accepted-reply`);
  }

  /** Envía un reporte moderable sobre una publicación. */
  reportPost(postId: number, payload: CreateReportRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/posts/${postId}/reports`, payload);
  }

  /** Envía un reporte moderable sobre una respuesta. */
  reportReply(replyId: number, payload: CreateReportRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/replies/${replyId}/reports`, payload);
  }
}
