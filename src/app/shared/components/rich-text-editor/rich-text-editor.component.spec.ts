import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { RichTextEditorComponent } from './rich-text-editor.component';

/**
 * Pruebas del editor de texto enriquecido reutilizable.
 *
 * <p>Verifica el contrato de {@code ControlValueAccessor}, la
 * detección de estado vacío (para gating de submit en formularios),
 * la aplicación de comandos por la toolbar y la sanitización del
 * HTML entrante para evitar inyección de scripts.</p>
 */
describe('RichTextEditorComponent', () => {
  let fixture: ComponentFixture<RichTextEditorComponent>;
  let component: RichTextEditorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RichTextEditorComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(RichTextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function editable(): HTMLDivElement {
    return fixture.debugElement.query(By.css('.rte__editable')).nativeElement as HTMLDivElement;
  }

  it('renderiza la toolbar y el área editable', () => {
    const buttons = fixture.debugElement.queryAll(By.css('.rte__btn'));
    expect(buttons.length).toBeGreaterThan(5);
    expect(editable().getAttribute('contenteditable')).toBe('true');
  });

  it('reconoce el estado vacío inicial', () => {
    expect(component['empty']()).toBeTrue();
    expect(editable().classList).toContain('rte__editable--empty');
  });

  describe('writeValue', () => {
    it('inyecta HTML en el área editable', () => {
      component.writeValue('<p>hola <strong>mundo</strong></p>');
      expect(editable().innerHTML).toContain('hola');
      expect(editable().innerHTML).toContain('<strong>mundo</strong>');
      expect(component['empty']()).toBeFalse();
    });

    it('trata null como cadena vacía', () => {
      component.writeValue(null);
      expect(editable().innerHTML).toBe('');
      expect(component['empty']()).toBeTrue();
    });

    it('sanitiza HTML con scripts', () => {
      component.writeValue('<p>ok</p><script>alert(1)</script>');
      expect(editable().innerHTML).toContain('ok');
      expect(editable().innerHTML.toLowerCase()).not.toContain('<script');
    });
  });

  describe('ControlValueAccessor', () => {
    it('emite cambios a través de registerOnChange al escribir', () => {
      const spy = jasmine.createSpy('onChange');
      component.registerOnChange(spy);
      editable().innerHTML = '<p>texto nuevo</p>';
      editable().dispatchEvent(new Event('input'));
      expect(spy).toHaveBeenCalled();
      expect(spy.calls.mostRecent().args[0]).toContain('texto nuevo');
    });

    it('emite cadena vacía cuando el usuario deja el editor sin contenido real', () => {
      const spy = jasmine.createSpy('onChange');
      component.registerOnChange(spy);
      editable().innerHTML = '<p><br></p>';
      editable().dispatchEvent(new Event('input'));
      expect(spy).toHaveBeenCalledWith('');
      expect(component['empty']()).toBeTrue();
    });

    it('marca como tocado al perder el foco', () => {
      const spy = jasmine.createSpy('onTouched');
      component.registerOnTouched(spy);
      editable().dispatchEvent(new Event('blur'));
      expect(spy).toHaveBeenCalled();
    });

    it('respeta setDisabledState', () => {
      component.setDisabledState(true);
      fixture.detectChanges();
      expect(component['disabled']()).toBeTrue();
      const container = fixture.debugElement.query(By.css('.rte')).nativeElement as HTMLElement;
      expect(container.classList).toContain('rte--disabled');
    });
  });

  describe('toolbar', () => {
    it('llama execCommand con el comando y valor configurados', () => {
      const execSpy = spyOn(document, 'execCommand').and.returnValue(true);
      const boldBtn = fixture.debugElement.queryAll(By.css('.rte__btn')).find(
        (btn) => btn.attributes['data-cmd'] === 'b',
      );
      expect(boldBtn).toBeDefined();
      boldBtn!.triggerEventHandler('mousedown', { preventDefault: () => undefined });
      expect(execSpy).toHaveBeenCalledWith('bold', false, undefined);
    });

    it('applica formatBlock=h3 para encabezado', () => {
      const execSpy = spyOn(document, 'execCommand').and.returnValue(true);
      const hBtn = fixture.debugElement.queryAll(By.css('.rte__btn')).find(
        (btn) => btn.attributes['data-cmd'] === 'h',
      );
      hBtn!.triggerEventHandler('mousedown', { preventDefault: () => undefined });
      expect(execSpy).toHaveBeenCalledWith('formatBlock', false, 'h3');
    });

    it('no ejecuta comandos cuando el editor está deshabilitado', () => {
      const execSpy = spyOn(document, 'execCommand').and.returnValue(true);
      component.setDisabledState(true);
      component['exec']('bold');
      expect(execSpy).not.toHaveBeenCalled();
    });

    it('pide URL para insertar un enlace usando prompt', () => {
      spyOn(window, 'prompt').and.returnValue('https://impulso.tech');
      const execSpy = spyOn(document, 'execCommand').and.returnValue(true);
      component['insertLink']();
      expect(execSpy).toHaveBeenCalledWith('createLink', false, 'https://impulso.tech');
    });

    it('no inserta enlace si el usuario cancela el prompt', () => {
      spyOn(window, 'prompt').and.returnValue(null);
      const execSpy = spyOn(document, 'execCommand').and.returnValue(true);
      component['insertLink']();
      expect(execSpy).not.toHaveBeenCalled();
    });
  });

  it('convierte el pegado en texto plano', () => {
    const execSpy = spyOn(document, 'execCommand').and.returnValue(true);
    const clipboard = new DataTransfer();
    clipboard.setData('text/plain', 'plano');
    const event = new ClipboardEvent('paste', { clipboardData: clipboard });
    spyOn(event, 'preventDefault');
    component['onPaste'](event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(execSpy).toHaveBeenCalledWith('insertText', false, 'plano');
  });
});
