import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { CertificateResponse, CertificateVerification } from './certificate.dto';
import { CertificatesService } from './certificates.service';

/**
 * Pruebas del servicio HTTP de certificados (RF-047).
 */
describe('CertificatesService', () => {
  let service: CertificatesService;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const sample: CertificateResponse = {
    id: 1,
    verificationCode: '11111111-2222-3333-4444-555555555555',
    courseId: 10,
    courseName: 'Backend con Spring',
    recipientName: 'Ana Pérez',
    issuedAt: '2026-09-01T12:00:00Z',
  };

  const verification: CertificateVerification = {
    verificationCode: sample.verificationCode,
    recipientName: sample.recipientName,
    courseName: sample.courseName,
    issuedAt: sample.issuedAt,
    valid: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CertificatesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CertificatesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listMine consume el endpoint privado del usuario autenticado', () => {
    service.listMine().subscribe((list) => {
      expect(list.length).toBe(1);
      expect(list[0].courseName).toBe('Backend con Spring');
    });
    const req = http.expectOne(`${baseUrl}/users/me/certificates`);
    expect(req.request.method).toBe('GET');
    req.flush([sample]);
  });

  it('verify consume el endpoint público con el código en la URL', () => {
    service.verify(sample.verificationCode).subscribe((response) => {
      expect(response.valid).toBeTrue();
      expect(response.recipientName).toBe('Ana Pérez');
    });
    const req = http.expectOne(`${baseUrl}/certificates/${sample.verificationCode}`);
    expect(req.request.method).toBe('GET');
    req.flush(verification);
  });

  it('downloadUrl construye la URL pública del PDF sin hacer request', () => {
    const url = service.downloadUrl(sample.verificationCode);
    expect(url).toBe(`${baseUrl}/certificates/${sample.verificationCode}/download`);
    http.expectNone(() => true);
  });
});
