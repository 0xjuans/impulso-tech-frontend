import { TourSlide } from './tour-video.component';

/** Diapositivas del tour para el perfil de estudiante. */
export const STUDENT_TOUR_SLIDES: TourSlide[] = [
  {
    title: 'Inicio',
    items: [
      'Resumen de tu progreso y cursos activos',
      'XP acumulada, nivel actual y racha de estudio',
      'Insignias obtenidas y ranking de la comunidad',
    ],
  },
  {
    title: 'Rutas de aprendizaje',
    items: [
      'Catálogo de rutas publicadas por la plataforma',
      'Cada ruta agrupa cursos en un orden lógico',
      'Duración estimada y tecnologías involucradas',
    ],
  },
  {
    title: 'Cursos',
    items: [
      'Catálogo completo de cursos disponibles',
      'Detalle del curso con módulos y lecciones',
      'Inscripción con un clic y progreso visible',
    ],
  },
  {
    title: 'Lecciones y evaluaciones',
    items: [
      'Contenido enriquecido con ejemplos de código',
      'Marcar como completada al terminar cada lección',
      'Evaluaciones al final de cada módulo',
    ],
  },
  {
    title: 'Retos de código',
    items: [
      'Problemas de programación con distintos niveles',
      'Editor de código integrado en la plataforma',
      'Envía soluciones y revisa tus intentos',
    ],
  },
  {
    title: 'Proyectos',
    items: [
      'Proyectos prácticos con instrucciones completas',
      'Envía la URL de tu trabajo terminado',
      'Retroalimentación del instructor en cada entrega',
    ],
  },
  {
    title: 'Laboratorios',
    items: [
      'Entorno sandbox para experimentar con código',
      'Instrucciones paso a paso para cada práctica',
      'Verificación automática del resultado',
    ],
  },
  {
    title: 'Recursos educativos',
    items: [
      'Biblioteca de PDFs, videos, guías y código',
      'Filtros por tipo, dificultad y búsqueda libre',
      'Marca tus favoritos para acceso rápido',
    ],
  },
  {
    title: 'Comunidad',
    items: [
      'Foro con publicaciones y respuestas',
      'Comparte dudas, logros y fragmentos de código',
      'Interactúa con otros estudiantes del curso',
    ],
  },
  {
    title: 'Mensajes',
    items: [
      'Mensajería directa con otros usuarios',
      'Notificación de mensajes nuevos en el menú',
      'Historial completo de conversaciones',
    ],
  },
  {
    title: 'Notificaciones',
    items: [
      'Insignias obtenidas y subidas de nivel',
      'Cursos completados y evaluaciones',
      'Marca como leídas individual o masivamente',
    ],
  },
  {
    title: 'Certificados',
    items: [
      'Certificados automáticos al completar un curso',
      'Código de verificación único por certificado',
      'Descarga y verificación pública',
    ],
  },
  {
    title: 'Mi perfil',
    items: [
      'Datos personales y foto de perfil',
      'Resumen de gamificación: XP, nivel, racha',
      'Insignias coleccionadas e historial',
    ],
  },
];

/** Diapositivas del tour para el perfil de instructor. */
export const INSTRUCTOR_TOUR_SLIDES: TourSlide[] = [
  {
    title: 'Dashboard',
    items: [
      'Vista general de tus cursos y estudiantes',
      'Estadísticas de inscripciones y progreso',
      'Actividad reciente en tus contenidos',
    ],
  },
  {
    title: 'Gestión de rutas',
    items: [
      'Crear y editar rutas de aprendizaje',
      'Asociar cursos a cada ruta en orden',
      'Publicar, archivar o deshabilitar rutas',
    ],
  },
  {
    title: 'Gestión de cursos',
    items: [
      'Crear cursos con módulos y lecciones',
      'Editor de contenido HTML enriquecido',
      'Gestionar estado: borrador, publicado, archivado',
    ],
  },
  {
    title: 'Evaluaciones',
    items: [
      'Crear evaluaciones asociadas a lecciones',
      'Preguntas de selección múltiple y verdadero/falso',
      'Configurar porcentaje mínimo y límite de tiempo',
    ],
  },
  {
    title: 'Retos de código',
    items: [
      'Crear retos con instrucciones y dificultad',
      'Configurar ejemplos de entrada y salida',
      'Revisar y calificar intentos de estudiantes',
    ],
  },
  {
    title: 'Proyectos',
    items: [
      'Crear proyectos con requisitos y criterios',
      'Revisar entregas enviadas por estudiantes',
      'Calificar con retroalimentación detallada',
    ],
  },
  {
    title: 'Laboratorios',
    items: [
      'Crear laboratorios con instrucciones paso a paso',
      'Configurar lenguaje y plantilla inicial',
      'Definir criterios de verificación automática',
    ],
  },
  {
    title: 'Mensajes y notificaciones',
    items: [
      'Comunicación directa con estudiantes',
      'Notificaciones de entregas y actividad',
      'Gestión de tu perfil profesional',
    ],
  },
];
