import {
  ChangeDetectionStrategy,
  Component,
  Input,
  forwardRef,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Campo de contraseña reutilizable con botón para alternar la
 * visibilidad del valor ingresado.
 *
 * <p>Implementa {@link ControlValueAccessor} para integrarse de forma
 * transparente con formularios reactivos y {@code ngModel}. El botón
 * "ojo" cambia el atributo {@code type} entre {@code password} y
 * {@code text} manteniendo la accesibilidad mediante
 * {@code aria-pressed} y {@code aria-label}.</p>
 */
@Component({
  selector: 'app-password-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-field.component.html',
  styleUrl: './password-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordFieldComponent),
      multi: true,
    },
  ],
})
export class PasswordFieldComponent implements ControlValueAccessor {
  /** Identificador HTML del input; enlaza con el {@code <label for>}. */
  @Input() id?: string;

  /** Texto marcador cuando el campo está vacío. */
  @Input() placeholder = '';

  /** Modo de autocompletar sugerido al navegador. */
  @Input() autocomplete: 'current-password' | 'new-password' | 'off' = 'current-password';

  /**
   * Indica al lector de pantalla si el control está marcado como
   * inválido. Se pasa desde el formulario contenedor.
   */
  @Input() ariaInvalid: boolean | null | undefined = null;

  /** Estado interno de visibilidad del texto. */
  protected readonly visible = signal(false);

  /** Valor actual del input. */
  protected readonly value = signal('');

  /** Deshabilitado por el formulario contenedor. */
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  protected toggleVisibility(): void {
    this.visible.update((v) => !v);
  }
}
