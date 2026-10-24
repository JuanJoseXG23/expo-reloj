// Datos del equipo y de la clase (se usan en portada, lobby, cierre y presentación).
export const COURSE = 'Sistemas Digitales y Ensambladores';
export const SCHOOL = 'Politécnico Grancolombiano';
export const PROFESSOR = 'Jaime Andrés Zurita López';
export const TOPIC = 'Señales de reloj y diagramas de tiempo';

export const TEAM = [
  { short: 'Juan José', full: 'Juan José Gómez Roldán', part: 'El reloj' },
  { short: 'Cristian', full: 'Cristian Murillo Ramírez', part: 'Diagramas de tiempo' },
  { short: 'Renzo', full: 'Renzo Olivieri García', part: 'El reloj en ensamblador' },
] as const;

export function fullName(short: string): string {
  return TEAM.find((p) => p.short === short)?.full ?? short;
}
