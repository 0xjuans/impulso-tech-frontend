/**
 * Contratos DTO expuestos por el módulo de certificados (RF-047).
 *
 * <p>Se corresponden 1:1 con los DTOs Java {@code CertificateResponse}
 * y {@code CertificateVerificationResponse} del backend.</p>
 */

export interface CertificateResponse {
  readonly id: number;
  readonly verificationCode: string;
  readonly courseId: number;
  readonly courseName: string;
  readonly recipientName: string;
  readonly issuedAt: string;
}

export interface CertificateVerification {
  readonly verificationCode: string;
  readonly recipientName: string;
  readonly courseName: string;
  readonly issuedAt: string;
  readonly valid: boolean;
}
