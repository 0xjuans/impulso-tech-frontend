import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/services/auth.service';
import {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketType,
} from '../../../core/api/support/support.dto';
import { SupportService } from '../../../core/api/support/support.service';

/**
 * Página administrativa de tickets de soporte (RF-036).
 *
 * Ofrece un listado con filtros por estado, tipo y responsable
 * asignado. Cada ticket puede cambiar de estado, ser asignado al
 * administrador autenticado o desasignado.
 */
@Component({
  selector: 'app-admin-support-page',
  standalone: true,
  imports: [DatePipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-support-page.component.html',
  styleUrl: './admin-support-page.component.scss',
})
export class AdminSupportPageComponent implements OnInit {
  private readonly service = inject(SupportService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly tickets = signal<readonly SupportTicket[]>([]);
  protected readonly selected = signal<SupportTicket | null>(null);
  protected readonly resolution = signal('');
  protected readonly saving = signal(false);

  protected readonly statusFilter = signal<SupportTicketStatus | ''>('');
  protected readonly typeFilter = signal<SupportTicketType | ''>('');
  protected readonly onlyMine = signal(false);

  protected readonly statuses: readonly SupportTicketStatus[] = [
    'PENDIENTE',
    'EN_REVISION',
    'EN_PROCESO',
    'RESUELTO',
    'CERRADO',
  ];

  protected readonly types: readonly SupportTicketType[] = [
    'TECHNICAL_ERROR',
    'COURSE_ISSUE',
    'LESSON_ISSUE',
    'ACTIVITY_ISSUE',
    'CHALLENGE_ISSUE',
    'LAB_ISSUE',
    'EVALUATION_ISSUE',
    'PROJECT_ISSUE',
    'RESOURCE_ISSUE',
    'AI_MASCOT_ISSUE',
  ];

  ngOnInit(): void {
    this.reload();
  }

  protected apply(): void {
    this.reload();
  }

  protected select(ticket: SupportTicket): void {
    this.selected.set(ticket);
    this.resolution.set(ticket.resolutionNotes ?? '');
  }

  protected changeStatus(status: SupportTicketStatus): void {
    const ticket = this.selected();
    if (!ticket || ticket.status === status) return;
    this.update({ status });
  }

  protected assignToMe(): void {
    const ticket = this.selected();
    const meId = this.auth.currentUser()?.id;
    if (!ticket || !meId || ticket.assigneeId === meId) return;
    this.update({ assigneeId: meId });
  }

  protected unassign(): void {
    const ticket = this.selected();
    if (!ticket || ticket.assigneeId == null) return;
    this.update({ assigneeId: -1 });
  }

  protected saveResolution(): void {
    const ticket = this.selected();
    if (!ticket) return;
    this.update({ resolutionNotes: this.resolution() });
  }

  private update(patch: Partial<{ status: SupportTicketStatus; assigneeId: number; resolutionNotes: string }>): void {
    const ticket = this.selected();
    if (!ticket || this.saving()) return;
    this.saving.set(true);
    this.service
      .update(ticket.id, patch)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          this.selected.set(updated);
          this.tickets.update((list) =>
            list.map((t) => (t.id === updated.id ? updated : t)),
          );
        },
      });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    const meId = this.auth.currentUser()?.id;
    this.service
      .listAdmin({
        status: this.statusFilter() || undefined,
        type: this.typeFilter() || undefined,
        assigneeId: this.onlyMine() && meId ? meId : undefined,
        page: 0,
        size: 50,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.tickets.set(page.content);
          if (page.content.length > 0 && this.selected() == null) {
            this.select(page.content[0]);
          } else if (page.content.length === 0) {
            this.selected.set(null);
          }
        },
        error: () =>
          this.error.set(
            'No pudimos cargar los tickets en este momento. Inténtalo nuevamente.',
          ),
      });
  }
}
