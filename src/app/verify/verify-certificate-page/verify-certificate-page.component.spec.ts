import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { CertificateVerification } from '../../core/api/certificates/certificate.dto';
import { VerifyCertificatePageComponent } from './verify-certificate-page.component';

/**
 * Pruebas de la página pública de verificación de certificados
 * (RF-047).
 */
describe('VerifyCertificatePageComponent', () => {
  let fixture: ComponentFixture<VerifyCertificatePageComponent>;
  let component: VerifyCertificatePageComponent;
  let http: HttpTestingController;
  const code = '11111111-2222-3333-4444-555555555555';
  const url = `${environment.apiBaseUrl}/certificates/${code}`;

  const verification: CertificateVerification = {
    verificationCode: code,
    recipientName: 'Ana Pérez',
    courseName: 'Backend con Spring',
    issuedAt: '2026-09-01T12:00:00Z',
    valid: true,
  };

  async function setup(paramCode: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [VerifyCertificatePageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(paramCode ? { code: paramCode } : {}),
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(VerifyCertificatePageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http?.verify());

  it('muestra los datos del certificado cuando el código es válido', async () => {
    await setup(code);
    fixture.detectChanges();
    http.expectOne(url).flush(verification);
    expect(component['certificate']()?.courseName).toBe('Backend con Spring');
    expect(component['error']()).toBeNull();
  });

  it('marca error cuando el backend responde 404', async () => {
    await setup(code);
    fixture.detectChanges();
    http.expectOne(url).flush({ message: 'no existe' }, { status: 404, statusText: 'Not Found' });
    expect(component['certificate']()).toBeNull();
    expect(component['error']()).toContain('no corresponde');
  });

  it('marca error de inmediato si no viene código en la URL', async () => {
    await setup(null);
    fixture.detectChanges();
    expect(component['error']()).toContain('no suministrado');
    http.expectNone(() => true);
  });
});
