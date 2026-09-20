import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Transforma texto con formato Markdown ligero al HTML equivalente,
 * pensado principalmente para las respuestas de la mascota IA
 * (RF-017 / RF-027).
 *
 * <p>Se soportan los patrones que produce el proveedor de IA con mayor
 * frecuencia: negrita ({@code **texto**} o {@code __texto__}), cursiva
 * ({@code *texto*} o {@code _texto_}), código en línea
 * ({@code `código`}), bloques de código con triple backtick, encabezados
 * de nivel 1 a 3 y listas simples con guiones.</p>
 *
 * <p>El HTML de entrada se escapa antes de aplicar el reemplazo para
 * evitar inyección de HTML/JS por parte del proveedor; sólo las
 * etiquetas resultantes de la transformación se dejan pasar. El
 * resultado se marca como {@link SafeHtml} para consumo directo desde
 * {@code [innerHTML]}.</p>
 */
@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (value == null || value === '') {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
    return this.sanitizer.bypassSecurityTrustHtml(toHtml(value));
  }
}

/** Convierte el texto Markdown recibido a HTML seguro. */
function toHtml(raw: string): string {
  let text = escapeHtml(raw);

  // Bloques de código con triple backtick.
  text = text.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);

  // Código en línea `x`.
  text = text.replace(/`([^`\n]+?)`/g, '<code>$1</code>');

  // Encabezados al inicio de línea.
  text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Negrita: **x** o __x__.
  text = text.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');

  // Cursiva: *x* o _x_ (evita colisión con negrita ya reemplazada).
  text = text.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  text = text.replace(/(^|[^_])_([^_\n]+?)_(?!_)/g, '$1<em>$2</em>');

  // Listas simples con guiones al inicio de línea.
  text = text.replace(/(?:^|\n)((?:[-*] .+(?:\n|$))+)/g, (_, block: string) => {
    const items = block
      .trim()
      .split(/\n/)
      .map((line) => line.replace(/^[-*] /, '').trim())
      .filter((line) => line.length > 0)
      .map((line) => `<li>${line}</li>`)
      .join('');
    return `\n<ul>${items}</ul>\n`;
  });

  // Saltos de línea sueltos → <br>.
  text = text.replace(/\n/g, '<br>');

  // Compactación: colapsa <br> alrededor de bloques HTML.
  text = text.replace(/<br>\s*(<(?:ul|pre|h[1-3]|li)>)/g, '$1');
  text = text.replace(/(<\/(?:ul|pre|h[1-3])>)\s*<br>/g, '$1');

  return text;
}

/** Escapa los caracteres reservados de HTML para prevenir inyección. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
