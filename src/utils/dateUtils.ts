import { DayOfWeek } from '../types';
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
 * Returns the exact Date corresponding to a DayOfWeek in the current week.
 * lunes = Monday (+0), martes = Tuesday (+1), ... domingo = Sunday (+6)
 */
export function getDateForDayOfWeek(dayId: DayOfWeek, baseDate: Date = new Date()): Date {
  const dayOffsets: Record<DayOfWeek, number> = {
    lunes: 0,
    martes: 1,
    miercoles: 2,
    jueves: 3,
    viernes: 4,
    sabado: 5,
    domingo: 6,
  };
  const monday = getMondayOfWeek(baseDate);
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
 * Returns the date only formatted as "DD.MM.YY" for a day of week
 */
export function getDayDateOnly(dayId: DayOfWeek, baseDate: Date = new Date()): string {
  const date = getDateForDayOfWeek(dayId, baseDate);
  return formatDateDDMMYY(date);
}

/**
 * Returns formatted short label: "Lun 31.08.26", "Mar 01.09.26", "Mié 02.09.26", etc.
 */
export function getDayShortFormatted(dayId: DayOfWeek, baseDate: Date = new Date()): string {
  const dayMeta = DAYS.find((d) => d.id === dayId);
  const shortName = dayMeta ? dayMeta.short : dayId.slice(0, 3);
  const dateStr = getDayDateOnly(dayId, baseDate);
  return `${shortName} ${dateStr}`;
}

/**
 * Returns formatted full label: "Lunes 31.08.26", "Martes 01.09.26", etc.
 */
export function getDayFullFormatted(dayId: DayOfWeek, baseDate: Date = new Date()): string {
  const dayMeta = DAYS.find((d) => d.id === dayId);
  const fullName = dayMeta ? dayMeta.label : dayId;
  const dateStr = getDayDateOnly(dayId, baseDate);
  return `${fullName} ${dateStr}`;
}
