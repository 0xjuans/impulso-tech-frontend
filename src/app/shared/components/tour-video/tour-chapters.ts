/**
 * Capítulo del recorrido en video: una sección de la plataforma con el
 * segundo en el que empieza dentro del video y la ruta a la que lleva.
 */
export interface TourChapter {
  readonly label: string;
  readonly description: string;
  readonly start: number;
  readonly link: string;
  /** Capítulo introductorio sin destino propio; oculta el botón «Ir a». */
  readonly intro?: boolean;
}

/**
 * Capítulos del recorrido del estudiante. Los tiempos corresponden a
 * {@code assets/video/student-tour.mp4}; si el video se regenera deben
 * actualizarse para que la navegación por capítulos siga sincronizada.
 */
export const STUDENT_TOUR_CHAPTERS: readonly TourChapter[] = [
  { label: 'Bienvenida', description: 'Qué es Impulso Tech y qué puedes hacer aquí.', start: 0, link: '/student/home', intro: true },
  { label: 'Inicio', description: 'Tu panel con accesos rápidos, racha y nivel.', start: 22.57, link: '/student/home' },
  { label: 'Luki', description: 'Tu mascota con IA: pídele explicaciones, pistas o ideas.', start: 42.5, link: '/student/home' },
  { label: 'Rutas', description: 'Rutas de aprendizaje con cursos organizados.', start: 56.86, link: '/student/routes' },
  { label: 'Cursos', description: 'Inscríbete y avanza por módulos y lecciones.', start: 65.82, link: '/student/courses' },
  { label: 'Retos', description: 'Desafíos de programación para ganar experiencia.', start: 74.4, link: '/student/challenges' },
  { label: 'Proyectos', description: 'Entregables reales que suman puntos.', start: 82.09, link: '/student/projects' },
  { label: 'Laboratorios', description: 'Escribe y ejecuta código en el navegador.', start: 89.78, link: '/student/labs' },
  { label: 'Recursos', description: 'Material de apoyo, documentación y guías.', start: 97.32, link: '/student/resources' },
  { label: 'Comunidad', description: 'Comparte y pregunta a otros estudiantes.', start: 111.28, link: '/student/community' },
  { label: 'Mensajes', description: 'Habla con instructores y compañeros.', start: 126.27, link: '/student/messages' },
  { label: 'Notificaciones', description: 'Actividad importante de tus cursos.', start: 132.33, link: '/student/notifications' },
  { label: 'Certificados', description: 'Los certificados de tus cursos completados.', start: 138.53, link: '/student/certificates' },
  { label: 'Mi perfil', description: 'Tus datos y tu progreso en la plataforma.', start: 145.11, link: '/student/profile' },
];

/**
 * Capítulos del recorrido del instructor. Los tiempos corresponden a
 * {@code assets/video/instructor-tour.mp4}.
 */
export const INSTRUCTOR_TOUR_CHAPTERS: readonly TourChapter[] = [
  { label: 'Bienvenida', description: 'Qué es Impulso Tech y qué puedes hacer aquí.', start: 0, link: '/instructor/dashboard', intro: true },
  { label: 'Panel', description: 'Métricas de tu contenido y tareas pendientes.', start: 22.64, link: '/instructor/dashboard' },
  { label: 'Rutas', description: 'Crea y edita rutas de aprendizaje.', start: 41.2, link: '/instructor/routes' },
  { label: 'Cursos', description: 'Administra módulos, lecciones y contenido.', start: 48.6, link: '/instructor/courses' },
  { label: 'Evaluaciones', description: 'Evaluaciones para tus lecciones.', start: 54.94, link: '/instructor/evaluations' },
  { label: 'Retos', description: 'Desafíos y revisión de intentos.', start: 61.04, link: '/instructor/challenges' },
  { label: 'Proyectos', description: 'Entregas evaluables y sus revisiones.', start: 74.23, link: '/instructor/projects' },
  { label: 'Laboratorios', description: 'Ejercicios de código con ejecución en la nube.', start: 80.55, link: '/instructor/labs' },
  { label: 'Mensajes', description: 'Comunicación directa con tus estudiantes.', start: 94.15, link: '/instructor/messages' },
  { label: 'Notificaciones', description: 'Nuevas entregas e inscripciones.', start: 99.46, link: '/instructor/notifications' },
  { label: 'Mi perfil', description: 'Tu información y estadísticas como instructor.', start: 105.35, link: '/instructor/profile' },
];
