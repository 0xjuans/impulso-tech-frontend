import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from './auth.service';
import { AuthStorageService } from './auth-storage.service';

/**
 * Pruebas del cierre proactivo de sesión al vencer el JWT.
 *
 * <p>Se apoya en {@link fakeAsync} para controlar el reloj y verificar
 * que, al expirar el token, el servicio limpia la sesión y redirige al
 * usuario a la landing pública.</p>
 */
describe('AuthService — cierre automático por expiración', () => {
  let router: Router;
  let storage: AuthStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    router = TestBed.inject(Router);
    storage = TestBed.inject(AuthStorageService);
  });

  /**
   * Construye un JWT válido a nivel estructural con el {@code exp}
   * indicado (segundos Unix). La firma no importa: aquí solo probamos
   * la lectura del payload.
   */
  function jwt(expSeconds: number): string {
    const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = base64url(JSON.stringify({ exp: expSeconds }));
    return `${header}.${payload}.sig`;
  }

  function base64url(value: string): string {
    return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  it('descarta la sesión guardada si el token ya expiró', () => {
    const expiredToken = jwt(Math.floor(Date.now() / 1000) - 60);
    storage.save({
      accessToken: expiredToken,
      tokenType: 'Bearer',
      expiresAt: '',
      user: { id: 1 } as never,
    });

    const auth = TestBed.inject(AuthService);

    expect(auth.getAccessToken()).toBeNull();
    expect(auth.isAuthenticated()).toBeFalse();
    expect(storage.read()).toBeNull();
  });

  it('mantiene la sesión activa cuando el token aún no expiró', () => {
    const futureToken = jwt(Math.floor(Date.now() / 1000) + 60);
    storage.save({
      accessToken: futureToken,
      tokenType: 'Bearer',
      expiresAt: '',
      user: { id: 1 } as never,
    });

    const auth = TestBed.inject(AuthService);

    expect(auth.getAccessToken()).toBe(futureToken);
    expect(auth.isAuthenticated()).toBeTrue();
  });

  it('al expirar el token cierra sesión y redirige a la landing', fakeAsync(() => {
    const auth = TestBed.inject(AuthService);
    const navigateSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const futureToken = jwt(Math.floor(Date.now() / 1000) + 2);
    storage.save({
      accessToken: futureToken,
      tokenType: 'Bearer',
      expiresAt: '',
      user: { id: 1 } as never,
    });
    // Forzamos el flujo de persistSession con el token conocido.
    (auth as unknown as { persistSession(r: unknown): void }).persistSession({
      accessToken: futureToken,
      tokenType: 'Bearer',
      expiresAt: '',
      user: { id: 1 } as never,
    });
    expect(auth.isAuthenticated()).toBeTrue();

    tick(2001);

    expect(auth.isAuthenticated()).toBeFalse();
    expect(auth.getAccessToken()).toBeNull();
    expect(storage.read()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith('/');
  }));

  it('un logout manual cancela el temporizador y no dispara redirección extra', fakeAsync(() => {
    const auth = TestBed.inject(AuthService);
    const navigateSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const futureToken = jwt(Math.floor(Date.now() / 1000) + 5);
    (auth as unknown as { persistSession(r: unknown): void }).persistSession({
      accessToken: futureToken,
      tokenType: 'Bearer',
      expiresAt: '',
      user: { id: 1 } as never,
    });

    auth.clearSession();
    tick(6000);

    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  afterEach(() => {
    storage.clear();
  });
});
