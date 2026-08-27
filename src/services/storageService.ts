import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DAYS, INITIAL_RESIDENTS, createDefaultWeekSchedule } from '../constants';
import { AbsenceRecord, AdminNote, DayOfWeek, GuestEntry, MealSelection, Resident, ResidentWeeklySchedule, SupabaseConfig } from '../types';
import { formatDateToISO } from '../utils/dateUtils';

const STORAGE_KEY_PREFERENCES = 'residencia_meal_preferences_v2';
const STORAGE_KEY_CONFIG = 'residencia_supabase_config_v2';
const STORAGE_KEY_RESIDENTS = 'residencia_residents_initials_v2';
const STORAGE_KEY_GUESTS = 'residencia_guests_v2';
const STORAGE_KEY_ADMIN_AGENDA = 'residencia_admin_agenda_v2';
const STORAGE_KEY_ABSENCES = 'residencia_absences_v2';

let supabaseInstance: SupabaseClient | null = null;
let currentConfig: SupabaseConfig = {
  url: '',
  anonKey: '',
  isConfigured: false,
};

function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Strip trailing /rest/v1 or /rest/v1/
  url = url.replace(/\/rest\/v1\/?$/, '');
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  return url;
}

// Initialize config from index.html (window), env, or localStorage
export function initializeSupabaseConfig(): SupabaseConfig {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  const win = window as unknown as {
    SUPABASE_URL?: string;
    SUPABASE_KEY?: string;
    supabaseClient?: SupabaseClient;
  };

  const windowUrl = win.SUPABASE_URL || '';
  const windowKey = win.SUPABASE_KEY || '';

  const savedConfigStr = localStorage.getItem(STORAGE_KEY_CONFIG);
  let savedUrl = '';
  let savedKey = '';

  if (savedConfigStr) {
    try {
      const parsed = JSON.parse(savedConfigStr);
      savedUrl = parsed.url || '';
      savedKey = parsed.anonKey || '';
    } catch {
      // ignore
    }
  }

  const rawActiveUrl = windowUrl.trim() || envUrl.trim() || savedUrl.trim();
  const activeUrl = sanitizeUrl(rawActiveUrl);
  const activeKey = windowKey.trim() || envKey.trim() || savedKey.trim();

  currentConfig = {
    url: activeUrl,
    anonKey: activeKey,
    isConfigured: Boolean(activeUrl && activeKey && activeUrl.startsWith('http')),
  };

  if (currentConfig.isConfigured) {
    try {
      supabaseInstance = createClient(currentConfig.url, currentConfig.anonKey, {
        auth: { persistSession: false },
      });
    } catch (e) {
      console.warn('Error al inicializar Supabase client:', e);
      supabaseInstance = null;
      currentConfig.isConfigured = false;
    }
  } else {
    supabaseInstance = null;
  }

  return currentConfig;
}

export function getSupabaseConfig(): SupabaseConfig {
  return currentConfig;
}

export function saveSupabaseConfig(url: string, anonKey: string): { success: boolean; isConfigured: boolean } {
  const cleanUrl = sanitizeUrl(url);
  const cleanKey = anonKey.trim();

  localStorage.setItem(
    STORAGE_KEY_CONFIG,
    JSON.stringify({
      url: cleanUrl,
      anonKey: cleanKey,
    })
  );

  currentConfig = {
    url: cleanUrl,
    anonKey: cleanKey,
    isConfigured: Boolean(cleanUrl && cleanKey && cleanUrl.startsWith('http')),
  };

  if (currentConfig.isConfigured) {
    try {
      supabaseInstance = createClient(cleanUrl, cleanKey, {
        auth: { persistSession: false },
      });
      return { success: true, isConfigured: true };
    } catch {
      supabaseInstance = null;
      currentConfig.isConfigured = false;
      return { success: false, isConfigured: false };
    }
  } else {
    supabaseInstance = null;
    return { success: true, isConfigured: false };
  }
}

// ----------------------------------------------------
// RESIDENTS WITH INITIALS
// ----------------------------------------------------
export function getStoredResidents(): Resident[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_RESIDENTS);
    if (data) {
      const parsed: Resident[] = JSON.parse(data);
      // Validate that it has 10 elements and uses the initials structure
      if (Array.isArray(parsed) && parsed.length === 10 && parsed.some(r => r.name === 'ILC' || r.name === 'ASR')) {
        const updated = parsed.map(r => r.name === 'MGB' ? { ...r, name: 'MFG' } : r);
        if (JSON.stringify(updated) !== JSON.stringify(parsed)) {
          localStorage.setItem(STORAGE_KEY_RESIDENTS, JSON.stringify(updated));
        }
        return updated;
      }
    }
  } catch {
    // fallback
  }
  // Store default 10 initials
  localStorage.setItem(STORAGE_KEY_RESIDENTS, JSON.stringify(INITIAL_RESIDENTS));
  return INITIAL_RESIDENTS;
}

export function saveStoredResidents(residents: Resident[]) {
  localStorage.setItem(STORAGE_KEY_RESIDENTS, JSON.stringify(residents));
}

// ----------------------------------------------------
// LOCAL STORAGE RESIDENT PREFERENCES
// ----------------------------------------------------
export function getLocalPreferences(): Record<number, ResidentWeeklySchedule> {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PREFERENCES);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // fallback
  }

  // Generate seed sample data for the 10 resident initials
  const initialData: Record<number, ResidentWeeklySchedule> = {};
  INITIAL_RESIDENTS.forEach((res) => {
    initialData[res.id] = createDefaultWeekSchedule();
  });

  localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(initialData));
  return initialData;
}

export function saveLocalPreferences(data: Record<number, ResidentWeeklySchedule>) {
  localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(data));
}

// ----------------------------------------------------
// GUEST ENTRIES (COMENSALES EXTRA)
// ----------------------------------------------------
export function getLocalGuests(): GuestEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_GUESTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveLocalGuests(guests: GuestEntry[]) {
  localStorage.setItem(STORAGE_KEY_GUESTS, JSON.stringify(guests));
}

export async function loadAllGuests(): Promise<{
  data: GuestEntry[];
  source: 'supabase' | 'local';
}> {
  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      const { data, error } = await supabaseInstance.from('guest_entries').select('*');
      if (!error && data) {
        const mapped: GuestEntry[] = data.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          day: row.day as DayOfWeek,
          mealType: row.meal_type as GuestEntry['mealType'],
          serviceMode: row.service_mode as GuestEntry['serviceMode'],
          count: Number(row.count || 1),
          hostName: String(row.host_name || 'Residencia'),
          menuType: (row.menu_type as GuestEntry['menuType']) || 'estandar',
          notes: String(row.notes || ''),
          createdAt: String(row.created_at || ''),
        }));
        saveLocalGuests(mapped);
        return { data: mapped, source: 'supabase' };
      }
    } catch {
      // ignore, use fallback
    }
  }
  return { data: getLocalGuests(), source: 'local' };
}

export async function saveGuestEntry(guest: GuestEntry): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  // Update local
  const current = getLocalGuests();
  const index = current.findIndex(g => g.id === guest.id);
  if (index >= 0) {
    current[index] = guest;
  } else {
    current.push(guest);
  }
  saveLocalGuests(current);

  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      const payload = {
        id: guest.id,
        day: guest.day,
        meal_type: guest.mealType,
        service_mode: guest.serviceMode,
        count: guest.count,
        host_name: guest.hostName,
        menu_type: guest.menuType,
        notes: guest.notes || '',
        updated_at: new Date().toISOString(),
      };
      await supabaseInstance.from('guest_entries').upsert(payload, { onConflict: 'id' });
      return { success: true, source: 'supabase' };
    } catch {
      return { success: true, source: 'local' };
    }
  }

  return { success: true, source: 'local' };
}

export async function deleteGuestEntry(guestId: string): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  const current = getLocalGuests().filter(g => g.id !== guestId);
  saveLocalGuests(current);

  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      await supabaseInstance.from('guest_entries').delete().eq('id', guestId);
      return { success: true, source: 'supabase' };
    } catch {
      return { success: true, source: 'local' };
    }
  }

  return { success: true, source: 'local' };
}

// ----------------------------------------------------
// UNIFIED LOAD PREFERENCES (Supabase -> Local)
// ----------------------------------------------------
export async function loadAllPreferences(): Promise<{
  data: Record<number, ResidentWeeklySchedule>;
  source: 'supabase' | 'local';
  error?: string;
}> {
  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      const { data, error } = await supabaseInstance.from('meal_preferences').select('*');

      if (error) {
        console.warn('Error al cargar de Supabase, usando datos locales:', error);
        return {
          data: getLocalPreferences(),
          source: 'local',
          error: `Error Supabase: ${error.message}`,
        };
      }

      if (data && data.length > 0) {
        const schedules: Record<number, ResidentWeeklySchedule> = {};

        INITIAL_RESIDENTS.forEach((res) => {
          schedules[res.id] = createDefaultWeekSchedule();
        });

        data.forEach((row: Record<string, unknown>) => {
          const resId = Number(row.resident_id);
          const day = row.day as DayOfWeek;

          if (schedules[resId] && day && schedules[resId][day]) {
            schedules[resId][day] = {
              desayuno_en_casa: Boolean(row.desayuno_en_casa),
              comida_en_casa: Boolean(row.comida_en_casa),
              comida_tupper: Boolean(row.comida_tupper),
              comida_segundo_turno: Boolean(row.comida_segundo_turno),
              cena_en_casa: Boolean(row.cena_en_casa),
              cena_tupper: Boolean(row.cena_tupper),
              cena_segundo_turno: Boolean(row.cena_segundo_turno),
              observaciones: typeof row.observaciones === 'string' ? row.observaciones : '',
            };
          }
        });

        saveLocalPreferences(schedules);
        return { data: schedules, source: 'supabase' };
      }
    } catch (err: unknown) {
      console.warn('Excepción al conectar con Supabase:', err);
    }
  }

  return { data: getLocalPreferences(), source: 'local' };
}

// Save single day preference
export async function saveDayPreference(
  residentId: number,
  residentName: string,
  day: DayOfWeek,
  selection: MealSelection
): Promise<{ success: boolean; source: 'supabase' | 'local'; error?: string }> {
  const localData = getLocalPreferences();
  if (!localData[residentId]) {
    localData[residentId] = createDefaultWeekSchedule();
  }
  localData[residentId][day] = { ...selection };
  saveLocalPreferences(localData);

  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      const rowId = `${residentId}_${day}`;
      const payload = {
        id: rowId,
        resident_id: residentId,
        resident_name: residentName,
        day: day,
        desayuno_en_casa: selection.desayuno_en_casa,
        comida_en_casa: selection.comida_en_casa,
        comida_tupper: selection.comida_tupper,
        comida_segundo_turno: selection.comida_segundo_turno,
        cena_en_casa: selection.cena_en_casa,
        cena_tupper: selection.cena_tupper,
        cena_segundo_turno: selection.cena_segundo_turno,
        observaciones: selection.observaciones || '',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseInstance.from('meal_preferences').upsert(payload, {
        onConflict: 'id',
      });

      if (error) {
        console.error('Error al guardar en Supabase:', error);
        return { success: false, source: 'local', error: error.message };
      }

      return { success: true, source: 'supabase' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, source: 'local', error: errorMsg };
    }
  }

  return { success: true, source: 'local' };
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> {
  const cleanUrl = sanitizeUrl(url);
  const cleanKey = anonKey.trim();

  if (!cleanUrl || !cleanKey) {
    return {
      success: false,
      message: 'Debes proporcionar la URL del proyecto y la anon public key.',
    };
  }

  try {
    const client = createClient(cleanUrl, cleanKey, {
      auth: { persistSession: false },
    });

    const { error } = await client.from('meal_preferences').select('id').limit(1);

    if (error) {
      return {
        success: false,
        message: `Error al consultar la tabla meal_preferences: ${error.message}`,
      };
    }

    return {
      success: true,
      message: '¡Conexión exitosa con Supabase! Los datos se sincronizarán en tiempo real.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `No se pudo conectar con Supabase: ${errorMsg}`,
    };
  }
}

// ----------------------------------------------------
// AGENDA ADMINISTRACIÓN (PETICIONES Y AVISOS POR FECHA CONCRETA)
// ----------------------------------------------------
const DEFAULT_INITIAL_ADMIN_NOTES: AdminNote[] = [
  {
    id: 'note_init_1',
    title: 'Ajuste de horario de cena del jueves',
    description: 'Varios residentes tienen examen y partido universitario. Solicitar retrasar 30 minutos el segundo turno de cena o dejar los platos preparados.',
    category: 'horarios',
    author: 'ILC',
    priority: 'urgente',
    status: 'pendiente',
    targetDate: formatDateToISO(new Date()),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'note_init_2',
    title: 'Revisión del termo de agua caliente en planta 2',
    description: 'Por las mañanas baja la presión y sale templada a primera hora. Pedir que avisen al servicio técnico de fontanería.',
    category: 'mantenimiento',
    author: 'JAM',
    priority: 'normal',
    status: 'pendiente',
    targetDate: formatDateToISO(new Date()),
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export function getLocalAdminNotes(): AdminNote[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_ADMIN_AGENDA);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  // Store default sample notes with today's date
  localStorage.setItem(STORAGE_KEY_ADMIN_AGENDA, JSON.stringify(DEFAULT_INITIAL_ADMIN_NOTES));
  return DEFAULT_INITIAL_ADMIN_NOTES;
}

export function saveLocalAdminNotes(notes: AdminNote[]) {
  localStorage.setItem(STORAGE_KEY_ADMIN_AGENDA, JSON.stringify(notes));
}

export async function loadAllAdminNotes(): Promise<{
  data: AdminNote[];
  source: 'supabase' | 'local';
}> {
  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      const { data, error } = await supabaseInstance
        .from('admin_agenda_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length >= 0) {
        const mapped: AdminNote[] = data.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          title: String(row.title || ''),
          description: String(row.description || ''),
          category: (row.category as AdminNote['category']) || 'general',
          author: String(row.author || 'Residente'),
          priority: (row.priority as AdminNote['priority']) || 'normal',
          status: (row.status as AdminNote['status']) || 'pendiente',
          targetDate: row.target_date ? String(row.target_date) : formatDateToISO(new Date()),
          createdAt: String(row.created_at || new Date().toISOString()),
          updatedAt: row.updated_at ? String(row.updated_at) : undefined,
          calledInAt: row.called_in_at ? String(row.called_in_at) : undefined,
          responseNotes: row.response_notes ? String(row.response_notes) : undefined,
        }));
        saveLocalAdminNotes(mapped);
        return { data: mapped, source: 'supabase' };
      }
    } catch {
      // ignore, fallback to local
    }
  }
  return { data: getLocalAdminNotes(), source: 'local' };
}

export async function saveAdminNote(note: AdminNote): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  // Update local state
  const current = getLocalAdminNotes();
  const index = current.findIndex((n) => n.id === note.id);
  if (index >= 0) {
    current[index] = { ...note, updatedAt: new Date().toISOString() };
  } else {
    current.unshift(note);
  }
  saveLocalAdminNotes(current);

  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      const payload = {
        id: note.id,
        title: note.title,
        description: note.description || '',
        category: note.category,
        author: note.author,
        priority: note.priority,
        status: note.status,
        target_date: note.targetDate || formatDateToISO(new Date()),
        created_at: note.createdAt,
        updated_at: new Date().toISOString(),
        called_in_at: note.calledInAt || null,
        response_notes: note.responseNotes || null,
      };
      await supabaseInstance.from('admin_agenda_notes').upsert(payload, { onConflict: 'id' });
      return { success: true, source: 'supabase' };
    } catch {
      return { success: true, source: 'local' };
    }
  }

  return { success: true, source: 'local' };
}

export async function deleteAdminNote(noteId: string): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  const current = getLocalAdminNotes().filter((n) => n.id !== noteId);
  saveLocalAdminNotes(current);

  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      await supabaseInstance.from('admin_agenda_notes').delete().eq('id', noteId);
      return { success: true, source: 'supabase' };
    } catch {
      return { success: true, source: 'local' };
    }
  }

  return { success: true, source: 'local' };
}

// ----------------------------------------------------
// GESTIÓN DE AUSENCIAS / VIAJES POR RANGO DE FECHAS
// ----------------------------------------------------
export function getLocalAbsences(): AbsenceRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_ABSENCES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveLocalAbsences(absences: AbsenceRecord[]) {
  localStorage.setItem(STORAGE_KEY_ABSENCES, JSON.stringify(absences));
}

export async function loadAllAbsences(): Promise<{
  data: AbsenceRecord[];
  source: 'supabase' | 'local';
}> {
  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      const { data, error } = await supabaseInstance
        .from('resident_absences')
        .select('*')
        .order('start_date', { ascending: true });

      if (!error && data) {
        const mapped: AbsenceRecord[] = data.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          residentId: Number(row.resident_id),
          residentName: String(row.resident_name || ''),
          startDate: String(row.start_date || ''),
          endDate: String(row.end_date || ''),
          reason: String(row.reason || ''),
          createdAt: String(row.created_at || ''),
        }));
        saveLocalAbsences(mapped);
        return { data: mapped, source: 'supabase' };
      }
    } catch {
      // fallback to local
    }
  }
  return { data: getLocalAbsences(), source: 'local' };
}

export async function saveAbsence(absence: AbsenceRecord): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  const current = getLocalAbsences();
  const index = current.findIndex((a) => a.id === absence.id);
  if (index >= 0) {
    current[index] = absence;
  } else {
    current.push(absence);
  }
  saveLocalAbsences(current);

  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      const payload = {
        id: absence.id,
        resident_id: absence.residentId,
        resident_name: absence.residentName,
        start_date: absence.startDate,
        end_date: absence.endDate,
        reason: absence.reason || '',
        updated_at: new Date().toISOString(),
      };
      await supabaseInstance.from('resident_absences').upsert(payload, { onConflict: 'id' });
      return { success: true, source: 'supabase' };
    } catch {
      return { success: true, source: 'local' };
    }
  }

  return { success: true, source: 'local' };
}

export async function deleteAbsence(absenceId: string): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  const current = getLocalAbsences().filter((a) => a.id !== absenceId);
  saveLocalAbsences(current);

  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      await supabaseInstance.from('resident_absences').delete().eq('id', absenceId);
      return { success: true, source: 'supabase' };
    } catch {
      return { success: true, source: 'local' };
    }
  }

  return { success: true, source: 'local' };
}

