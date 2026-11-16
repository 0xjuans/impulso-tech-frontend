import { TestBed } from '@angular/core/testing';

import { MarkdownPipe } from './markdown.pipe';

/**
 * Pruebas del {@link MarkdownPipe}: valida el mapeo de los patrones
 * Markdown que produce con más frecuencia la mascota IA y confirma que
 * el HTML de entrada se escapa para evitar inyección.
 */
describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    pipe = TestBed.runInInjectionContext(() => new MarkdownPipe());
  });

  function html(value: string): string {
    return (pipe.transform(value) as { changingThisBreaksApplicationSecurity: string })
      .changingThisBreaksApplicationSecurity;
  }

  it('renderiza negrita con **', () => {
    expect(html('Hola **Juan**')).toContain('<strong>Juan</strong>');
  });

  it('renderiza cursiva con *', () => {
    expect(html('hola *mundo*')).toContain('<em>mundo</em>');
  });

  it('respeta la precedencia entre ** y *', () => {
    const out = html('**negrita** y *cursiva*');
    expect(out).toContain('<strong>negrita</strong>');
    expect(out).toContain('<em>cursiva</em>');
  });

  it('renderiza código en línea con backticks', () => {
    expect(html('usa `map()` aquí')).toContain('<code>map()</code>');
  });

  it('renderiza bloques de código con triple backtick', () => {
    const out = html('```\nconst x = 1;\n```');
    expect(out).toContain('<pre><code>const x = 1;</code></pre>');
  });

  it('renderiza listas simples con guiones', () => {
    const out = html('- uno\n- dos\n- tres');
    expect(out).toContain('<ul>');
    expect(out).toContain('<li>uno</li>');
    expect(out).toContain('<li>tres</li>');
  });

  it('renderiza encabezados de nivel 1 a 3', () => {
    expect(html('# titulo')).toContain('<h1>titulo</h1>');
    expect(html('## sub')).toContain('<h2>sub</h2>');
    expect(html('### terciario')).toContain('<h3>terciario</h3>');
  });

  it('convierte saltos de línea en <br>', () => {
    expect(html('linea a\nlinea b')).toContain('linea a<br>linea b');
  });

  it('escapa HTML entrante para evitar inyección', () => {
    const out = html('<script>alert(1)</script>');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });

  it('devuelve cadena vacía para null/undefined/""', () => {
    expect(html(null as unknown as string)).toBe('');
    expect(html(undefined as unknown as string)).toBe('');
    expect(html('')).toBe('');
  });
});
