import { ChangeDetectionStrategy, Component } from '@angular/core';

import { NavBarComponent } from '../../../shared/components/nav-bar/nav-bar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { FeaturesGridComponent } from '../../components/features-grid/features-grid.component';
import { LabsDemoComponent } from '../../components/labs-demo/labs-demo.component';
import { SocialProofComponent } from '../../components/social-proof/social-proof.component';
import { CtaBandComponent } from '../../components/cta-band/cta-band.component';

/**
 * Página pública principal de Impulso Tech.
 *
 * Actúa como contenedor de las distintas secciones de la landing page:
 * navegación, hero con video, cuadrícula de pilares, demostración de
 * laboratorios, prueba social, banda de llamada a la acción y pie de
 * página. Cada bloque se implementa en un componente independiente para
 * facilitar su reutilización y prueba.
 */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    NavBarComponent,
    HeroComponent,
    FeaturesGridComponent,
    LabsDemoComponent,
    SocialProofComponent,
    CtaBandComponent,
    FooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {}
