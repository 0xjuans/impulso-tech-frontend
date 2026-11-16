import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { User } from '../../auth/models/user.model';
import { UsersService } from './users.service';

/**
 * Pruebas del servicio HTTP de perfil del usuario autenticado (RF-005).
 *
 * <p>Verifican que los verbos HTTP y las rutas coinciden con las
 * expuestas por el backend, y que la carga útil devuelta por el
 * servidor se propaga tal cual a los consumidores.</p>
 */
describe('UsersService', () => {
  let service: UsersService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/users/me`;

  const sample: User = {
    id: 42,
    email: 'ana@impulso.tech',
    username: 'ana',
    firstName: 'Ana',
    lastName: 'Pérez',
    profilePhotoUrl: null,
    role: 'INSTRUCTOR',
    status: 'ACTIVA',
    emailVerifiedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsersService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getProfile consulta el perfil del usuario autenticado', () => {
    service.getProfile().subscribe((user) => expect(user).toEqual(sample));
    const req = http.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(sample);
  });

  it('updateProfile envía un PATCH con los cambios solicitados', () => {
    service.updateProfile({ firstName: 'Ana', lastName: 'García' }).subscribe();
    const req = http.expectOne(baseUrl);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ firstName: 'Ana', lastName: 'García' });
    req.flush(sample);
  });

  it('changePassword publica la petición al endpoint de contraseña', () => {
    service
      .changePassword({ currentPassword: 'antigua123', newPassword: 'nuevaSegura9' })
      .subscribe();
    const req = http.expectOne(`${baseUrl}/password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      currentPassword: 'antigua123',
      newPassword: 'nuevaSegura9',
    });
    req.flush({ message: 'ok' });
  });
});
