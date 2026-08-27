export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export interface MealSelection {
  // Desayuno
  desayuno_en_casa: boolean;
  
  // Comida
  comida_en_casa: boolean;
  comida_tupper: boolean;
  comida_segundo_turno: boolean;
  
  // Cena
  cena_en_casa: boolean;
  cena_tupper: boolean;
  cena_segundo_turno: boolean;

  // Observaciones opcionales
  observaciones?: string;
}

export type ResidentWeeklySchedule = Record<DayOfWeek, MealSelection>;

export interface Resident {
  id: number;
  name: string; // Iniciales (ej. 'ILC', 'ASR'...)
  avatarColor?: string;
}

export type GuestMealType = 'desayuno' | 'comida' | 'cena';
export type GuestServiceMode = 'comedor_1' | 'comedor_2' | 'tupper';
export type GuestMenuType = 'estandar' | 'celiaco' | 'vegetariano' | 'sin_lactosa' | 'especial';

export interface GuestEntry {
  id: string;
  day: DayOfWeek;
  mealType: GuestMealType;
  serviceMode: GuestServiceMode;
  count: number; // Número de comensales invitados
  hostName: string; // Iniciales del anfitrión o 'Residencia'
  menuType: GuestMenuType;
  notes?: string;
  createdAt?: string;
}

export interface DayPreferenceRecord extends MealSelection {
  id?: string;
  resident_id: number;
  resident_name: string;
  day: DayOfWeek;
  updated_at?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export interface MealTotals {
  // Desayuno
  desayuno_residentes: number;
  desayuno_invitados: number;
  desayuno_total: number;

  // Comida
  comida_residentes_comedor_1: number;
  comida_residentes_comedor_2: number;
  comida_residentes_tupper: number;
  comida_residentes_total: number;
  comida_invitados_comedor_1: number;
  comida_invitados_comedor_2: number;
  comida_invitados_tupper: number;
  comida_invitados_total: number;
  comida_total_raciones: number; // Residentes + Invitados

  // Cena
  cena_residentes_comedor_1: number;
  cena_residentes_comedor_2: number;
  cena_residentes_tupper: number;
  cena_residentes_total: number;
  cena_invitados_comedor_1: number;
  cena_invitados_comedor_2: number;
  cena_invitados_tupper: number;
  cena_invitados_total: number;
  cena_total_raciones: number; // Residentes + Invitados
}

export type AdminNoteCategory = 
  | 'organizacion'   // Organización de la casa
  | 'horarios'       // Cambio de horarios
  | 'cocina'         // Cocina y compras
  | 'mantenimiento'  // Mantenimiento y reparaciones
  | 'general';       // General / Varios

export type AdminNotePriority = 'normal' | 'urgente';

export type AdminNoteStatus = 'pendiente' | 'transmitido' | 'resuelto';

export interface AbsenceRecord {
  id: string;
  residentId: number;
  residentName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason?: string;
  createdAt: string;
}

export interface AdminNote {
  id: string;
  title: string;              // Resumen / Título de la petición
  description?: string;        // Detalles explicativos
  category: AdminNoteCategory; // Categoría
  author: string;              // Iniciales del residente o "Director" / "Personal"
  priority: AdminNotePriority; // Normal / Urgente
  status: AdminNoteStatus;     // Pendiente, Transmitido por teléfono, Resuelto
  targetDate: string;          // Fecha concreta relevante (YYYY-MM-DD)
  createdAt: string;           // Timestamp ISO
  updatedAt?: string;
  calledInAt?: string;         // Cuándo se transmitió por teléfono
  responseNotes?: string;      // Respuesta o resolución
}
