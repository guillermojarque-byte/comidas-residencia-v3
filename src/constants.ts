import { DayOfWeek, MealSelection, Resident, ResidentWeeklySchedule, GuestMenuType, GuestServiceMode } from './types';

export const DAYS: { id: DayOfWeek; label: string; short: string; isWeekend?: boolean }[] = [
  { id: 'lunes', label: 'Lunes', short: 'Lun' },
  { id: 'martes', label: 'Martes', short: 'Mar' },
  { id: 'miercoles', label: 'Miércoles', short: 'Mié' },
  { id: 'jueves', label: 'Jueves', short: 'Jue' },
  { id: 'viernes', label: 'Viernes', short: 'Vie' },
  { id: 'sabado', label: 'Sábado', short: 'Sáb', isWeekend: true },
  { id: 'domingo', label: 'Domingo', short: 'Dom', isWeekend: true },
];

export const INITIAL_RESIDENTS: Resident[] = [
  { id: 1, name: 'ILC', avatarColor: 'bg-blue-600' },
  { id: 2, name: 'ASR', avatarColor: 'bg-emerald-600' },
  { id: 3, name: 'JAM', avatarColor: 'bg-amber-600' },
  { id: 4, name: 'AGD', avatarColor: 'bg-purple-600' },
  { id: 5, name: 'GJS', avatarColor: 'bg-rose-600' },
  { id: 6, name: 'DPJC', avatarColor: 'bg-teal-600' },
  { id: 7, name: 'DJAM', avatarColor: 'bg-indigo-600' },
  { id: 8, name: 'JGC', avatarColor: 'bg-cyan-600' },
  { id: 9, name: 'MGB', avatarColor: 'bg-pink-600' },
  { id: 10, name: 'ZBB', avatarColor: 'bg-orange-600' },
];

export const DEFAULT_MEAL_SELECTION: MealSelection = {
  desayuno_en_casa: true,
  comida_en_casa: true,
  comida_tupper: false,
  comida_segundo_turno: false,
  cena_en_casa: true,
  cena_tupper: false,
  cena_segundo_turno: false,
  observaciones: '',
};

export const createDefaultWeekSchedule = (): ResidentWeeklySchedule => ({
  lunes: { ...DEFAULT_MEAL_SELECTION },
  martes: { ...DEFAULT_MEAL_SELECTION },
  miercoles: { ...DEFAULT_MEAL_SELECTION },
  jueves: { ...DEFAULT_MEAL_SELECTION },
  viernes: { ...DEFAULT_MEAL_SELECTION },
  sabado: { ...DEFAULT_MEAL_SELECTION, desayuno_en_casa: true, comida_en_casa: true, cena_en_casa: false },
  domingo: { ...DEFAULT_MEAL_SELECTION, desayuno_en_casa: true, comida_en_casa: true, cena_en_casa: true },
});

export const GUEST_MENU_LABELS: Record<GuestMenuType, { label: string; color: string }> = {
  estandar: { label: 'Menú Estándar', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  celiaco: { label: 'Celíaco (Sin gluten)', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  vegetariano: { label: 'Vegetariano', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  sin_lactosa: { label: 'Sin lactosa', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  especial: { label: 'Dieta Especial / Alergia', color: 'bg-rose-100 text-rose-900 border-rose-300' },
};

export const GUEST_SERVICE_LABELS: Record<GuestServiceMode, string> = {
  comedor_1: 'Comedor (1er Turno)',
  comedor_2: 'Comedor (2º Turno)',
  tupper: 'Para llevar (Tupper)',
};
