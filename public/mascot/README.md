# Mascota IA — animaciones Rive

Este directorio aloja el archivo Rive con las animaciones de la mascota
educativa de Impulso Tech (RF-017). El componente
`MascotAvatarComponent` intenta cargar `mascot.riv` desde
`/mascot/mascot.riv` (servido estático desde `public/mascot/`); si no
existe, cae automáticamente al SVG inline heredado para no romper el
flujo del usuario.

## Cómo generar `mascot.riv`

1. Abre [Rive Studio](https://rive.app/) (gratis).
2. Importa la hoja de personaje (`assets/mascot/character-sheet.webp`
   o la que tengas). Cada parte del cuerpo va como un objeto separado
   dentro del artboard para poder animarla.
3. Crea un **State Machine** llamado exactamente `MascotStates` con
   una entrada de tipo `Number` llamada `state`.
4. Define un estado por cada pose de la hoja, con estos índices:

   | `state` | Pose | Uso semántico |
   |---|---|---|
   | 0 | Espera / Idle | Sin actividad |
   | 1 | Saludo | Al abrir el chat por primera vez |
   | 2 | Pensando | Mientras la IA procesa |
   | 3 | Hablando | Al mostrar la respuesta |
   | 4 | Celebrando | Al completar un logro |
   | 5 | Confundido | Ante un error o pregunta ambigua |
   | 6 | Felicitando | Al aprobar una evaluación |
   | 7 | Inactivo | Tras minutos sin interacción |

5. Exporta como `.riv` y guárdalo aquí como `mascot.riv`.

## Paleta oficial (a respetar en el archivo Rive)

- Naranja Impulso: `#FF4F00`
- Naranja intenso: `#E64700`
- Crema (fondo/textil): `#FFFEFB`
- Gris oscuro: `#3A3A3A`
- Gris medio: `#888888`
- Gris claro: `#D9D9D9`

## Verificación

Con el archivo en su sitio:

```powershell
npx ng test --watch=false --browsers=ChromeHeadless `
  --include=src/app/shared/components/mascot-avatar/**
```

Los tests actuales cubren la ruta de fallback. Cuando la mascota real
esté integrada, el widget la mostrará automáticamente sin cambios de
código adicionales.
