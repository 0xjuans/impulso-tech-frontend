# Video del hero

El componente `HeroComponent` reproduce como fondo el archivo
`hero.mp4` ubicado en este directorio.

Sustituye el archivo por un video educativo de programación con las
siguientes recomendaciones:

- Duración: 8-15 segundos, en bucle imperceptible.
- Resolución: 1920×1080, códec `h264`.
- Tasa de bits objetivo: ~1.5-2.5 Mbps para mantener la carga rápida.
- Sonido: no es necesario, el video se reproduce silenciado.
- Encuadre: dejar espacio libre a la izquierda para el texto principal.

Fallback:

- `hero-poster.svg` se muestra mientras el video carga o cuando el
  navegador no puede reproducirlo (por ejemplo, ahorro de datos).
- Si prefieres un formato adicional, agrega `hero.webm` para mejorar la
  compresión en navegadores compatibles.
