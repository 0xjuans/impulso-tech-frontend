import { DatePipe } from '@angular/common';
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
import { catchError, finalize, of } from 'rxjs';

import { AuthService } from '../../../core/auth/services/auth.service';
import {
  CommunityPostDetail,
  CommunityReply,
  CreateReplyRequest,
} from '../../../core/api/community/community.dto';
import { CommunityService } from '../../../core/api/community/community.service';

/**
 * Detalle de una publicación del foro (RF-034).
 *
 * <p>Presenta la publicación completa, sus respuestas ordenadas con
 * la aceptada primero, y permite al estudiante autenticado responder,
 * marcar respuestas como útiles y —si es autor de la publicación—
 * marcar cuál respuesta acepta como solución.</p>
 */
@Component({
  selector: 'app-community-post-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './community-post-page.component.html',
  styleUrl: './community-post-page.component.scss',
})
export class CommunityPostPageComponent implements OnInit {
  private readonly service = inject(CommunityService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly detail = signal<CommunityPostDetail | null>(null);

  protected readonly replyContent = signal('');
  protected readonly replyCode = signal('');
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  /** Publicación desanidada del envoltorio {@link CommunityPostDetail}. */
  protected readonly post = computed(() => this.detail()?.post ?? null);

  /** Ordena las respuestas colocando primero la aceptada, luego por fecha. */
  protected readonly orderedReplies = computed<readonly CommunityReply[]>(() => {
    const detail = this.detail();
    if (!detail) return [];
    return [...detail.replies].sort((a, b) => {
      if (a.accepted && !b.accepted) return -1;
      if (!a.accepted && b.accepted) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  });

  protected readonly canSubmit = computed(() => this.replyContent().trim().length > 0);

  /** Indica si el usuario autenticado es el autor de la publicación. */
  protected readonly isPostAuthor = computed(() => {
    const post = this.post();
    const me = this.auth.currentUser();
    return !!post && !!me && post.authorId === me.id;
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id)) {
      this.error.set('La publicación solicitada no existe.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.service
      .getPost(id)
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar la publicación. Puede haber sido eliminada.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((detail) => this.detail.set(detail));
  }

  protected submitReply(): void {
    const post = this.post();
    if (!post || !this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    const payload: CreateReplyRequest = {
      content: this.replyContent().trim(),
      codeSnippet: this.replyCode().trim() || null,
    };
    this.service
      .createReply(post.id, payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (reply) => {
          this.detail.update((current) =>
            current ? { ...current, replies: [...current.replies, reply] } : current,
          );
          this.replyContent.set('');
          this.replyCode.set('');
        },
        error: () =>
          this.submitError.set(
            'No pudimos publicar tu respuesta. Inténtalo nuevamente en unos segundos.',
          ),
      });
  }

  protected toggleHelpful(reply: CommunityReply): void {
    this.service.toggleHelpful(reply.id).subscribe({
      next: (updated) => this.replaceReply(updated),
    });
  }

  protected toggleAccepted(reply: CommunityReply): void {
    const post = this.post();
    if (!post || !this.isPostAuthor()) return;
    const action$ = reply.accepted
      ? this.service.clearAcceptedReply(post.id)
      : this.service.acceptReply(post.id, reply.id);
    action$.subscribe({
      next: (updatedPost) => {
        this.detail.update((current) =>
          current
            ? {
                post: { ...current.post, acceptedReplyId: updatedPost.acceptedReplyId },
                replies: current.replies.map((r) => ({
                  ...r,
                  accepted: r.id === updatedPost.acceptedReplyId,
                })),
              }
            : current,
        );
      },
    });
  }

  protected deletePost(): void {
    const post = this.post();
    if (!post) return;
    const confirmed = window.confirm('¿Eliminar esta publicación? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    this.service.deletePost(post.id).subscribe({
      next: () => void this.router.navigate(['/student/community']),
    });
  }

  protected deleteReply(reply: CommunityReply): void {
    const confirmed = window.confirm('¿Eliminar esta respuesta?');
    if (!confirmed) return;
    this.service.deleteReply(reply.id).subscribe({
      next: () => {
        this.detail.update((current) =>
          current
            ? { ...current, replies: current.replies.filter((r) => r.id !== reply.id) }
            : current,
        );
      },
    });
  }

  private replaceReply(updated: CommunityReply): void {
    this.detail.update((current) =>
      current
        ? {
            ...current,
            replies: current.replies.map((r) => (r.id === updated.id ? updated : r)),
          }
        : current,
    );
  }

  /** Indica si el usuario autenticado es el autor de la respuesta indicada. */
  protected isReplyAuthor(reply: CommunityReply): boolean {
    const me = this.auth.currentUser();
    return !!me && reply.authorId === me.id;
  }
}
