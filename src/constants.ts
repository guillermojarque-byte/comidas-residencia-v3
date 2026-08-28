import { DayOfWeek, MealSelection, Resident, ResidentWeeklySchedule, GuestMenuType, GuestServiceMode, Residencia } from './types';

export const DAYS: { id: DayOfWeek; label: string; short: string; isWeekend?: boolean }[] = [
  { id: 'lunes', label: 'Lunes', short: 'Lun' },
  { id: 'martes', label: 'Martes', short: 'Mar' },
  { id: 'miercoles', label: 'Miércoles', short: 'Mié' },
  { id: 'jueves', label: 'Jueves', short: 'Jue' },
  { id: 'viernes', label: 'Viernes', short: 'Vie' },
  { id: 'sabado', label: 'Sábado', short: 'Sáb', isWeekend: true },
  { id: 'domingo', label: 'Domingo', short: 'Dom', isWeekend: true },
];

export const RESIDENCIA_NAMES: Record<Residencia, string> = {
  ucanca: 'Ucanca',
  taiba: 'Taiba',
};

export const RESIDENCIA_BADGES: Record<Residencia, { name: string; capacity: number; tagColor: string; bgSoft: string; border: string; activeColor: string }> = {
  ucanca: {
    name: 'Residencia Ucanca',
    capacity: 10,
    tagColor: 'bg-emerald-600 text-white',
    bgSoft: 'bg-emerald-50 text-emerald-900',
    border: 'border-emerald-200',
    activeColor: 'bg-emerald-600',
  },
  taiba: {
    name: 'Residencia Taiba',
    capacity: 11,
    tagColor: 'bg-blue-600 text-white',
    bgSoft: 'bg-blue-50 text-blue-900',
    border: 'border-blue-200',
    activeColor: 'bg-blue-600',
  },
};

export const RESIDENTS_UCANCA: Resident[] = [
  { id: 1, name: 'ILC', residencia: 'ucanca', avatarColor: 'bg-blue-600' },
  { id: 2, name: 'ASR', residencia: 'ucanca', avatarColor: 'bg-emerald-600' },
  { id: 3, name: 'JAM', residencia: 'ucanca', avatarColor: 'bg-amber-600' },
  { id: 4, name: 'AGD', residencia: 'ucanca', avatarColor: 'bg-purple-600' },
  { id: 5, name: 'GJS', residencia: 'ucanca', avatarColor: 'bg-rose-600' },
  { id: 6, name: 'DPJC', residencia: 'ucanca', avatarColor: 'bg-teal-600' },
  { id: 7, name: 'DJAM', residencia: 'ucanca', avatarColor: 'bg-indigo-600' },
  { id: 8, name: 'JGC', residencia: 'ucanca', avatarColor: 'bg-cyan-600' },
  { id: 9, name: 'MGB', residencia: 'ucanca', avatarColor: 'bg-pink-600' },
  { id: 10, name: 'ZBB', residencia: 'ucanca', avatarColor: 'bg-orange-600' },
];

export const RESIDENTS_TAIBA: Resident[] = [
  { id: 101, name: 'MGC', residencia: 'taiba', avatarColor: 'bg-indigo-600' },
  { id: 102, name: 'JMN', residencia: 'taiba', avatarColor: 'bg-sky-600' },
  { id: 103, name: 'JCP', residencia: 'taiba', avatarColor: 'bg-violet-600' },
  { id: 104, name: 'DAC', residencia: 'taiba', avatarColor: 'bg-amber-600' },
  { id: 105, name: 'MM', residencia: 'taiba', avatarColor: 'bg-emerald-600' },
  { id: 106, name: 'CGA', residencia: 'taiba', avatarColor: 'bg-rose-600' },
  { id: 107, name: 'FSJ', residencia: 'taiba', avatarColor: 'bg-teal-600' },
  { id: 108, name: 'CMA', residencia: 'taiba', avatarColor: 'bg-cyan-600' },
  { id: 109, name: 'GBM', residencia: 'taiba', avatarColor: 'bg-fuchsia-600' },
  { id: 110, name: 'JHG', residencia: 'taiba', avatarColor: 'bg-blue-600' },
  { id: 111, name: 'JAD', residencia: 'taiba', avatarColor: 'bg-purple-600' },
];

export const INITIAL_RESIDENTS: Resident[] = RESIDENTS_UCANCA;

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
