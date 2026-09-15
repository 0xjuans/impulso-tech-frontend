import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Editor de texto enriquecido reutilizable para formularios de Impulso
 * Tech.
 *
 * <p>Envuelve un {@code contenteditable} nativo con una barra de
 * herramientas mínima (negrita, cursiva, subrayado, listas, código,
 * enlaces y encabezado). El contenido se almacena y expone como HTML,
 * sanitizado en escritura y lectura mediante {@link DomSanitizer} para
 * evitar inyección de scripts. Implementa {@link ControlValueAccessor}
 * para poder usarse con {@code [(ngModel)]} o {@code formControl}.</p>
 *
 * <p>Se eligió un contenteditable minimalista en lugar de una librería
 * pesada (Quill, TinyMCE) para mantener el bundle ligero y conservar
 * el lenguaje visual de la marca. Si en el futuro se necesita
 * funcionalidad avanzada (imágenes embebidas, colaboración, etc.) se
 * puede reemplazar el componente conservando la misma API pública.</p>
 */
@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.scss',
})
export class RichTextEditorComponent implements ControlValueAccessor, AfterViewInit {
  private readonly sanitizer = inject(DomSanitizer);

  /** Texto visible cuando el editor está vacío. */
  @Input() placeholder = 'Escribe aquí...';

  /** Altura mínima del área editable en píxeles. */
  @Input() minHeight = 160;

  /** Se enfoca automáticamente al montar (útil en composers). */
  @Input() autofocus = false;

  @ViewChild('editable', { static: true })
  private readonly editable!: ElementRef<HTMLDivElement>;

  protected readonly empty = signal(true);
  protected readonly disabled = signal(false);

  /**
   * Comandos declarados en la toolbar. Cada uno se dispara con
   * {@code document.execCommand}, que sigue siendo la vía más ligera
   * y ampliamente soportada por los navegadores actuales para editar
   * un {@code contenteditable}. Marcado como deprecado por la spec,
   * pero sin reemplazo estándar por el momento.
   */
  protected readonly toolbarCommands: readonly {
    id: string;
    label: string;
    title: string;
    command: string;
    value?: string;
  }[] = [
    { id: 'h', label: 'H', title: 'Encabezado', command: 'formatBlock', value: 'h3' },
    { id: 'p', label: '¶', title: 'Párrafo', command: 'formatBlock', value: 'p' },
    { id: 'b', label: 'B', title: 'Negrita', command: 'bold' },
    { id: 'i', label: 'I', title: 'Cursiva', command: 'italic' },
    { id: 'u', label: 'U', title: 'Subrayado', command: 'underline' },
    { id: 's', label: 'S', title: 'Tachado', command: 'strikeThrough' },
    { id: 'ul', label: '•', title: 'Lista', command: 'insertUnorderedList' },
    { id: 'ol', label: '1.', title: 'Lista numerada', command: 'insertOrderedList' },
    { id: 'code', label: '</>', title: 'Código', command: 'formatBlock', value: 'pre' },
    { id: 'quote', label: '“”', title: 'Cita', command: 'formatBlock', value: 'blockquote' },
  ];

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  ngAfterViewInit(): void {
    if (this.autofocus) {
      queueMicrotask(() => this.editable.nativeElement.focus());
    }
  }

  // ------------------- ControlValueAccessor -------------------

  writeValue(value: string | null): void {
    const html = value ?? '';
    const safe = this.sanitize(html);
    if (this.editable.nativeElement.innerHTML !== safe) {
      this.editable.nativeElement.innerHTML = safe;
    }
    this.empty.set(this.isEmpty(safe));
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

  // ------------------- Interacción -------------------

  /**
   * Aplica un comando de la toolbar sobre la selección actual. El
   * botón usa {@code (mousedown)} con {@code preventDefault} para no
   * perder el foco del área editable.
   */
  protected exec(command: string, value?: string): void {
    if (this.disabled()) return;
    this.editable.nativeElement.focus();
    document.execCommand(command, false, value);
    this.emit();
  }

  /**
   * Solicita la URL para insertar un enlace en la selección. Se usa
   * {@code prompt} deliberadamente por simplicidad; puede sustituirse
   * por un diálogo propio si la UX lo requiere.
   */
  protected insertLink(): void {
    if (this.disabled()) return;
    const url = window.prompt('URL del enlace (https://...)');
    if (!url) return;
    this.exec('createLink', url);
  }

  protected onInput(): void {
    this.emit();
  }

  protected onBlur(): void {
    this.onTouched();
  }

  /**
   * Al pegar contenido externo se descarta el formato original para
   * evitar que se filtren estilos ajenos al sistema de diseño y para
   * mantener el HTML resultante controlable.
   */
  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, text);
  }

  private emit(): void {
    const raw = this.editable.nativeElement.innerHTML;
    const cleaned = this.sanitize(raw);
    const value = this.isEmpty(cleaned) ? '' : cleaned;
    this.empty.set(this.isEmpty(cleaned));
    this.onChange(value);
  }

  private isEmpty(html: string): boolean {
    // El contenteditable inserta <br> al quedar vacío tras borrar
    // todo; también puede quedar como <p><br></p>. Se normaliza para
    // que aguas arriba (formularios, botones "canSubmit") vean "".
    const text = html
      .replace(/<br\s*\/?>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, '')
      .trim();
    return text.length === 0;
  }

  /**
   * Limpia el HTML entrante eliminando etiquetas y atributos
   * peligrosos (scripts, on-handlers, javascript: URLs). Se apoya en
   * el sanitizer de Angular para tener una implementación estándar.
   */
  private sanitize(html: string): string {
    if (!html) return '';
    const sanitized = this.sanitizer.sanitize(1 /* SecurityContext.HTML */, html);
    return sanitized ?? '';
  }
}
