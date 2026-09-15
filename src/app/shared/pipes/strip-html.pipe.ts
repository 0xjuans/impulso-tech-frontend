import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convierte una cadena de HTML en texto plano para previsualizaciones.
 *
 * <p>Se usa en listados y cards donde el CSS aplica un
 * {@code -webkit-line-clamp} para mostrar un resumen de dos o tres
 * líneas. Con HTML crudo aparecerían las etiquetas (
 * {@code <p>Curso...</p>}); con este pipe se conserva solo el texto,
 * se colapsan espacios en blanco y se decodifican las entidades más
 * comunes ({@code &amp;}, {@code &nbsp;}, etc.).</p>
 *
 * <p>Es un pipe puro: recibe una cadena y devuelve otra sin efectos
 * secundarios ni acceso al DOM. Se apoya en {@link DOMParser} porque
 * es más seguro que las expresiones regulares y respeta la codificación
 * de entidades HTML según el estándar.</p>
 */
@Pipe({
  name: 'stripHtml',
  standalone: true,
})
export class StripHtmlPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    // DOMParser decodifica entidades HTML correctamente y elimina
    // todas las etiquetas al leer solo textContent.
    const doc = new DOMParser().parseFromString(value, 'text/html');
    const text = doc.body.textContent ?? '';
    return text.replace(/\s+/g, ' ').trim();
  }
}
