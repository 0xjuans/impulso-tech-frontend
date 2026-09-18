import { StripHtmlPipe } from './strip-html.pipe';

/**
 * Pruebas del pipe {@link StripHtmlPipe} usado en listados para
 * previsualizar descripciones almacenadas como HTML.
 */
describe('StripHtmlPipe', () => {
  const pipe = new StripHtmlPipe();

  it('devuelve cadena vacía para null o undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('elimina etiquetas HTML dejando solo el texto', () => {
    expect(pipe.transform('<p>Hola <strong>mundo</strong></p>')).toBe('Hola mundo');
  });

  it('decodifica entidades HTML comunes', () => {
    expect(pipe.transform('<p>Perro &amp; gato</p>')).toBe('Perro & gato');
    expect(pipe.transform('<p>Non&nbsp;breaking</p>')).toContain('Non');
  });

  it('colapsa espacios en blanco múltiples', () => {
    expect(pipe.transform('<p>uno</p>\n  <p>dos</p>')).toBe('uno dos');
  });

  it('recorta espacios al inicio y al final', () => {
    expect(pipe.transform('   <p>  contenido  </p>   ')).toBe('contenido');
  });

  it('ignora scripts y no ejecuta código', () => {
    const result = pipe.transform('<p>ok</p><script>alert(1)</script>');
    expect(result).toContain('ok');
    expect(result).not.toContain('<script');
  });
});
