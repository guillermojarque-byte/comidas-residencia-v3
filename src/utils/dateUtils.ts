import { DayOfWeek, AbsenceRecord } from '../types';
import { DAYS } from '../constants';

/**
 * Returns the Monday of the current week (or base date).
 * In Spain/ISO, Monday is the start of the week.
 */
export function getMondayOfWeek(baseDate: Date = new Date()): Date {
  const date = new Date(baseDate);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Returns the Monday date for a given week offset from today (0 = current week, +1 = next, -1 = previous).
 */
export function getMondayForWeekOffset(weekOffset: number = 0, baseDate: Date = new Date()): Date {
  const monday = getMondayOfWeek(baseDate);
  if (weekOffset !== 0) {
    monday.setDate(monday.getDate() + weekOffset * 7);
  }
  return monday;
}

/**
 * Returns the exact Date corresponding to a DayOfWeek in the specified week offset.
 * lunes = Monday (+0), martes = Tuesday (+1), ... domingo = Sunday (+6)
 */
export function getDateForDayOfWeek(dayId: DayOfWeek, weekOffsetOrBaseDate: number | Date = 0): Date {
  const dayOffsets: Record<DayOfWeek, number> = {
    lunes: 0,
    martes: 1,
    miercoles: 2,
    jueves: 3,
    viernes: 4,
    sabado: 5,
    domingo: 6,
  };

  let monday: Date;
  if (typeof weekOffsetOrBaseDate === 'number') {
    monday = getMondayForWeekOffset(weekOffsetOrBaseDate);
  } else {
    monday = getMondayOfWeek(weekOffsetOrBaseDate);
  }

  const offset = dayOffsets[dayId] ?? 0;
  const result = new Date(monday);
  result.setDate(monday.getDate() + offset);
  return result;
}

/**
 * Formats a Date object to "DD.MM.YY" (e.g., "31.08.26", "01.09.26")
 */
export function formatDateDDMMYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

/**
 * Formats a Date object to ISO "YYYY-MM-DD"
 */
export function formatDateToISO(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parses "YYYY-MM-DD" string into a Date object at midnight local time
 */
export function parseISODate(isoStr: string): Date {
  if (!isoStr) return new Date();
  const [y, m, d] = isoStr.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Returns ISO "YYYY-MM-DD" for a day of week in the given week offset
 */
export function getDayISOString(dayId: DayOfWeek, weekOffset: number = 0): string {
  const date = getDateForDayOfWeek(dayId, weekOffset);
  return formatDateToISO(date);
}

/**
 * Returns the date only formatted as "DD.MM.YY" for a day of week
 */
export function getDayDateOnly(dayId: DayOfWeek, weekOffsetOrBaseDate: number | Date = 0): string {
  const date = getDateForDayOfWeek(dayId, weekOffsetOrBaseDate);
  return formatDateDDMMYY(date);
}

/**
 * Returns formatted short label: "Lun 31.08.26", "Mar 01.09.26", "Mié 02.09.26", etc.
 */
export function getDayShortFormatted(dayId: DayOfWeek, weekOffsetOrBaseDate: number | Date = 0): string {
  const dayMeta = DAYS.find((d) => d.id === dayId);
  const shortName = dayMeta ? dayMeta.short : dayId.slice(0, 3);
  const dateStr = getDayDateOnly(dayId, weekOffsetOrBaseDate);
  return `${shortName} ${dateStr}`;
}

/**
 * Returns formatted full label: "Lunes 31.08.26", "Martes 01.09.26", etc.
 */
export function getDayFullFormatted(dayId: DayOfWeek, weekOffsetOrBaseDate: number | Date = 0): string {
  const dayMeta = DAYS.find((d) => d.id === dayId);
  const fullName = dayMeta ? dayMeta.label : dayId;
  const dateStr = getDayDateOnly(dayId, weekOffsetOrBaseDate);
  return `${fullName} ${dateStr}`;
}

/**
 * Returns week range string: "Semana del 31.08.26 al 06.09.26"
 */
export function getWeekRangeLabel(weekOffset: number = 0): string {
  const monday = getMondayForWeekOffset(weekOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const monStr = formatDateDDMMYY(monday);
  const sunStr = formatDateDDMMYY(sunday);
  return `Semana ${monStr} – ${sunStr}`;
}

/**
 * Returns the next DayOfWeek in sequence (e.g. lunes -> martes, domingo -> lunes)
 */
export function getNextDayOfWeek(dayId: DayOfWeek): DayOfWeek {
  const dayOrder: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const currentIndex = dayOrder.indexOf(dayId);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % dayOrder.length : 0;
  return dayOrder[nextIndex];
}

/**
 * Returns today's DayOfWeek based on the current system date.
 * (0 = domingo, 1 = lunes, 2 = martes, 3 = miercoles, 4 = jueves, 5 = viernes, 6 = sabado)
 */
export function getCurrentDayOfWeek(baseDate: Date = new Date()): DayOfWeek {
  const day = baseDate.getDay();
  const dayMap: Record<number, DayOfWeek> = {
    0: 'domingo',
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes',
    6: 'sabado',
  };
  return dayMap[day] || 'lunes';
}

/**
 * Checks if a given DayOfWeek and weekOffset corresponds to today in the real calendar.
 */
export function isDayToday(dayId: DayOfWeek, weekOffset: number = 0, baseDate: Date = new Date()): boolean {
  if (weekOffset !== 0) return false;
  return dayId === getCurrentDayOfWeek(baseDate);
}

/**
 * Checks if a specific date (YYYY-MM-DD) falls within any registered absence for a resident.
 * Returns the matching AbsenceRecord if found, or undefined.
 */
export function isDateInAbsence(
  dateISO: string,
  absences: AbsenceRecord[],
  residentId: number
): AbsenceRecord | undefined {
  if (!dateISO || !absences || absences.length === 0) return undefined;
  return absences.find((abs) => {
    if (abs.residentId !== residentId) return false;
    return dateISO >= abs.startDate && dateISO <= abs.endDate;
  });
}

/**
 * Checks if a day of week in the given week offset falls within an absence for a resident.
 */
export function isDayInAbsence(
  dayId: DayOfWeek,
  weekOffset: number,
  absences: AbsenceRecord[],
  residentId: number
): AbsenceRecord | undefined {
  const dayISO = getDayISOString(dayId, weekOffset);
  return isDateInAbsence(dayISO, absences, residentId);
}

/**
 * Formats meal counts into standard "10D · 10C · 10Cn" notation
 */
export function formatMealsSummary(desayunos: number, comidas: number, cenas: number): string {
  return `${desayunos}D · ${comidas}C · ${cenas}Cn`;
}
