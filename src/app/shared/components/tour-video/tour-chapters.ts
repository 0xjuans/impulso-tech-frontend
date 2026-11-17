/**
 * Capítulo del recorrido en video: una sección de la plataforma con el
 * segundo en el que empieza dentro del video y la ruta a la que lleva.
 */
export interface TourChapter {
  readonly label: string;
  readonly description: string;
  readonly start: number;
  readonly link: string;
}

/**
 * Capítulos del recorrido del estudiante. Los tiempos corresponden a
 * {@code assets/video/student-tour.mp4}; si el video se regenera deben
 * actualizarse para que la navegación por capítulos siga sincronizada.
 */
export const STUDENT_TOUR_CHAPTERS: readonly TourChapter[] = [
  { label: 'Inicio', description: 'Tu panel con accesos rápidos, racha y nivel.', start: 0, link: '/student/home' },
  { label: 'Luki', description: 'Tu mascota con IA: pídele explicaciones, pistas o ideas.', start: 19.93, link: '/student/home' },
  { label: 'Rutas', description: 'Rutas de aprendizaje con cursos organizados.', start: 34.29, link: '/student/routes' },
  { label: 'Cursos', description: 'Inscríbete y avanza por módulos y lecciones.', start: 43.25, link: '/student/courses' },
  { label: 'Retos', description: 'Desafíos de programación para ganar experiencia.', start: 51.83, link: '/student/challenges' },
  { label: 'Proyectos', description: 'Entregables reales que suman puntos.', start: 59.52, link: '/student/projects' },
  { label: 'Laboratorios', description: 'Escribe y ejecuta código en el navegador.', start: 67.21, link: '/student/labs' },
  { label: 'Recursos', description: 'Material de apoyo, documentación y guías.', start: 74.75, link: '/student/resources' },
  { label: 'Comunidad', description: 'Comparte y pregunta a otros estudiantes.', start: 88.71, link: '/student/community' },
  { label: 'Mensajes', description: 'Habla con instructores y compañeros.', start: 103.7, link: '/student/messages' },
  { label: 'Notificaciones', description: 'Actividad importante de tus cursos.', start: 109.76, link: '/student/notifications' },
  { label: 'Certificados', description: 'Los certificados de tus cursos completados.', start: 115.96, link: '/student/certificates' },
  { label: 'Mi perfil', description: 'Tus datos y tu progreso en la plataforma.', start: 122.54, link: '/student/profile' },
];

/**
 * Capítulos del recorrido del instructor. Los tiempos corresponden a
 * {@code assets/video/instructor-tour.mp4}.
 */
export const INSTRUCTOR_TOUR_CHAPTERS: readonly TourChapter[] = [
  { label: 'Panel', description: 'Métricas de tu contenido y tareas pendientes.', start: 0, link: '/instructor/dashboard' },
  { label: 'Rutas', description: 'Crea y edita rutas de aprendizaje.', start: 18.56, link: '/instructor/routes' },
  { label: 'Cursos', description: 'Administra módulos, lecciones y contenido.', start: 25.96, link: '/instructor/courses' },
  { label: 'Evaluaciones', description: 'Evaluaciones para tus lecciones.', start: 32.3, link: '/instructor/evaluations' },
  { label: 'Retos', description: 'Desafíos y revisión de intentos.', start: 38.4, link: '/instructor/challenges' },
  { label: 'Proyectos', description: 'Entregas evaluables y sus revisiones.', start: 51.59, link: '/instructor/projects' },
  { label: 'Laboratorios', description: 'Ejercicios de código con ejecución en la nube.', start: 57.91, link: '/instructor/labs' },
  { label: 'Mensajes', description: 'Comunicación directa con tus estudiantes.', start: 71.51, link: '/instructor/messages' },
  { label: 'Notificaciones', description: 'Nuevas entregas e inscripciones.', start: 76.82, link: '/instructor/notifications' },
  { label: 'Mi perfil', description: 'Tu información y estadísticas como instructor.', start: 82.71, link: '/instructor/profile' },
];
