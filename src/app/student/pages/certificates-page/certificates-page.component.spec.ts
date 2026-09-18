import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { CertificateResponse } from '../../../core/api/certificates/certificate.dto';
import { CertificatesPageComponent } from './certificates-page.component';

/**
 * Pruebas de la página "Mis certificados" (RF-047).
 *
 * <p>Verifica el ciclo de carga, el manejo del estado vacío, el manejo
 * de errores del backend y que las URLs de descarga y verificación se
 * construyan correctamente sin disparar peticiones extra.</p>
 */
describe('CertificatesPageComponent', () => {
  let fixture: ComponentFixture<CertificatesPageComponent>;
  let component: CertificatesPageComponent;
  let http: HttpTestingController;
  const url = `${environment.apiBaseUrl}/users/me/certificates`;

  const sample: CertificateResponse = {
    id: 1,
    verificationCode: '11111111-2222-3333-4444-555555555555',
    courseId: 10,
    courseName: 'Backend con Spring',
    recipientName: 'Ana Pérez',
    issuedAt: '2026-09-01T12:00:00Z',
  };

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [CertificatesPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(CertificatesPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http?.verify());

  it('carga y muestra los certificados del usuario', async () => {
    await setup();
    fixture.detectChanges();
    http.expectOne(url).flush([sample]);
    fixture.detectChanges();
    expect(component['certificates']().length).toBe(1);
    expect(component['hasCertificates']()).toBeTrue();
  });

  it('muestra estado vacío cuando no hay certificados', async () => {
    await setup();
    fixture.detectChanges();
    http.expectOne(url).flush([]);
    expect(component['hasCertificates']()).toBeFalse();
    expect(component['error']()).toBeNull();
  });

  it('muestra error cuando el backend falla', async () => {
    await setup();
    fixture.detectChanges();
    http.expectOne(url).flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    expect(component['error']()).toContain('No pudimos cargar');
  });

  it('construye la URL de descarga sin disparar requests', async () => {
    await setup();
    fixture.detectChanges();
    http.expectOne(url).flush([sample]);
    const download = component['downloadUrl'](sample.verificationCode);
    expect(download).toBe(`${environment.apiBaseUrl}/certificates/${sample.verificationCode}/download`);
    expect(component['verifyPath'](sample.verificationCode)).toBe(`/verify/${sample.verificationCode}`);
  });
});
