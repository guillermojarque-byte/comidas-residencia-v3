import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DAYS, RESIDENTS_UCANCA, RESIDENTS_TAIBA, createDefaultWeekSchedule } from '../constants';
import { 
  AbsenceRecord, 
  AdminNote, 
  AdminNoteCategory, 
  AdminNotePriority, 
  AdminNoteStatus, 
  DayOfWeek, 
  GuestEntry, 
  MealSelection, 
  Residencia, 
  Resident, 
  ResidentWeeklySchedule, 
  SupabaseConfig 
} from '../types';
import { formatDateToISO } from '../utils/dateUtils';

const STORAGE_KEY_CONFIG = 'residencia_supabase_config_v2';
const STORAGE_KEY_RESIDENTS_UCANCA = 'residencia_residents_ucanca_v3';
const STORAGE_KEY_RESIDENTS_TAIBA = 'residencia_residents_taiba_v3';
const STORAGE_KEY_PREFERENCES_UCANCA = 'residencia_meal_preferences_ucanca_v3';
const STORAGE_KEY_PREFERENCES_TAIBA = 'residencia_meal_preferences_taiba_v3';
const STORAGE_KEY_GUESTS = 'residencia_guests_v3';
const STORAGE_KEY_ADMIN_AGENDA = 'residencia_admin_agenda_v3';
const STORAGE_KEY_ABSENCES = 'residencia_absences_v3';

let supabaseInstance: SupabaseClient | null = null;
let currentConfig: SupabaseConfig = {
  url: '',
  anonKey: '',
  isConfigured: false,
};

function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/\/rest\/v1\/?$/, '');
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
// RESIDENTS WITH INITIALS (PER RESIDENCY)
// ----------------------------------------------------
export function getStoredResidents(residencia: Residencia = 'ucanca'): Resident[] {
  const storageKey = residencia === 'ucanca' ? STORAGE_KEY_RESIDENTS_UCANCA : STORAGE_KEY_RESIDENTS_TAIBA;
  const defaults = residencia === 'ucanca' ? RESIDENTS_UCANCA : RESIDENTS_TAIBA;

  try {
    const data = localStorage.getItem(storageKey);
    if (data) {
      const parsed: Resident[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length === defaults.length) {
        const updated = parsed.map((r) => {
          if (r.id === 111 && (r.name === 'JDD' || !r.name)) {
            return { ...r, name: 'JAD', residencia };
          }
          return { ...r, residencia };
        });
        return updated;
      }
    }
  } catch {
    // fallback
  }

  localStorage.setItem(storageKey, JSON.stringify(defaults));
  return defaults;
}

export function saveStoredResidents(residents: Resident[], residencia: Residencia = 'ucanca') {
  const storageKey = residencia === 'ucanca' ? STORAGE_KEY_RESIDENTS_UCANCA : STORAGE_KEY_RESIDENTS_TAIBA;
  localStorage.setItem(storageKey, JSON.stringify(residents));
}

// ----------------------------------------------------
// LOCAL STORAGE RESIDENT PREFERENCES (PER RESIDENCY)
// ----------------------------------------------------
export function getLocalPreferences(residencia: Residencia = 'ucanca'): Record<number, ResidentWeeklySchedule> {
  const storageKey = residencia === 'ucanca' ? STORAGE_KEY_PREFERENCES_UCANCA : STORAGE_KEY_PREFERENCES_TAIBA;
  const initialResidents = residencia === 'ucanca' ? RESIDENTS_UCANCA : RESIDENTS_TAIBA;

  try {
    const data = localStorage.getItem(storageKey);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // fallback
  }

  const initialData: Record<number, ResidentWeeklySchedule> = {};
  initialResidents.forEach((res) => {
    initialData[res.id] = createDefaultWeekSchedule();
  });

  localStorage.setItem(storageKey, JSON.stringify(initialData));
  return initialData;
}

export function saveLocalPreferences(residencia: Residencia, data: Record<number, ResidentWeeklySchedule>) {
  const storageKey = residencia === 'ucanca' ? STORAGE_KEY_PREFERENCES_UCANCA : STORAGE_KEY_PREFERENCES_TAIBA;
  localStorage.setItem(storageKey, JSON.stringify(data));
}

// ----------------------------------------------------
// GUEST ENTRIES (COMENSALES EXTRA)
// ----------------------------------------------------
export function getLocalGuests(residencia?: Residencia): GuestEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_GUESTS);
    if (data) {
      const parsed: GuestEntry[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        if (!residencia) return parsed;
        return parsed.filter((g) => (g.residencia || 'ucanca') === residencia);
      }
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveLocalGuests(guests: GuestEntry[]) {
  localStorage.setItem(STORAGE_KEY_GUESTS, JSON.stringify(guests));
}

export async function loadAllGuests(residencia?: Residencia): Promise<{
  data: GuestEntry[];
  source: 'supabase' | 'local';
}> {
  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      let query = supabaseInstance.from('guest_entries').select('*');
      if (residencia) {
        query = query.eq('residencia', residencia);
      }
      const { data, error } = await query;
      if (!error && data) {
        const mapped: GuestEntry[] = data.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          residencia: (row.residencia as Residencia) || 'ucanca',
          day: row.day as DayOfWeek,
          mealType: row.meal_type as GuestEntry['mealType'],
          serviceMode: row.service_mode as GuestEntry['serviceMode'],
          count: Number(row.count || 1),
          hostName: String(row.host_name || 'Residencia'),
          menuType: (row.menu_type as GuestEntry['menuType']) || 'estandar',
          notes: String(row.notes || ''),
          createdAt: String(row.created_at || ''),
        }));
        
        // Merge with existing local guests for other residencies if scoped
        const currentAll = getLocalGuests();
        const otherResGuests = residencia ? currentAll.filter((g) => g.residencia !== residencia) : [];
        saveLocalGuests([...otherResGuests, ...mapped]);

        return { data: mapped, source: 'supabase' };
      }
    } catch {
      // ignore, use fallback
    }
  }
  return { data: getLocalGuests(residencia), source: 'local' };
}

export async function saveGuestEntry(guest: GuestEntry, residencia?: Residencia): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  const targetRes = guest.residencia || residencia || 'ucanca';
  const entry: GuestEntry = { ...guest, residencia: targetRes };

  // Update local
  const current = getLocalGuests();
  const index = current.findIndex((g) => g.id === entry.id);
  if (index >= 0) {
    current[index] = entry;
  } else {
    current.push(entry);
  }
  saveLocalGuests(current);

  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      const payload = {
        id: entry.id,
        residencia: entry.residencia,
        day: entry.day,
        meal_type: entry.mealType,
        service_mode: entry.serviceMode,
        count: entry.count,
        host_name: entry.hostName,
        menu_type: entry.menuType,
        notes: entry.notes || '',
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

export async function deleteGuestEntry(guestId: string, residencia?: Residencia): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  const current = getLocalGuests().filter((g) => g.id !== guestId);
  saveLocalGuests(current);

  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      let query = supabaseInstance.from('guest_entries').delete().eq('id', guestId);
      if (residencia) {
        query = query.eq('residencia', residencia);
      }
      await query;
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
export async function loadAllPreferences(residencia: Residencia = 'ucanca'): Promise<{
  data: Record<number, ResidentWeeklySchedule>;
  source: 'supabase' | 'local';
  error?: string;
}> {
  const initialResidents = residencia === 'ucanca' ? RESIDENTS_UCANCA : RESIDENTS_TAIBA;

  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      const { data, error } = await supabaseInstance
        .from('meal_preferences')
        .select('*')
        .eq('residencia', residencia);

      if (error) {
        console.warn('Error al cargar de Supabase, usando datos locales:', error);
        return {
          data: getLocalPreferences(residencia),
          source: 'local',
          error: `Error Supabase: ${error.message}`,
        };
      }

      if (data && data.length > 0) {
        const schedules: Record<number, ResidentWeeklySchedule> = {};

        initialResidents.forEach((res) => {
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

        saveLocalPreferences(residencia, schedules);
        return { data: schedules, source: 'supabase' };
      }
    } catch (err: unknown) {
      console.warn('Excepción al conectar con Supabase:', err);
    }
  }

  return { data: getLocalPreferences(residencia), source: 'local' };
}

// Save single day preference
export async function saveDayPreference(
  residentId: number,
  residentName: string,
  day: DayOfWeek,
  selection: MealSelection,
  residencia: Residencia = 'ucanca'
): Promise<{ success: boolean; source: 'supabase' | 'local'; error?: string }> {
  const localData = getLocalPreferences(residencia);
  if (!localData[residentId]) {
    localData[residentId] = createDefaultWeekSchedule();
  }
  localData[residentId][day] = { ...selection };
  saveLocalPreferences(residencia, localData);

  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      const rowId = `${residencia}_${residentId}_${day}`;
      const payload = {
        id: rowId,
        residencia: residencia,
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

export function getLocalAdminNotes(residencia?: Residencia): AdminNote[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_ADMIN_AGENDA);
    if (data) {
      const parsed: AdminNote[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        if (!residencia) return parsed;
        return parsed.filter((n) => (n.residencia || 'ucanca') === residencia);
      }
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveLocalAdminNotes(notes: AdminNote[]) {
  localStorage.setItem(STORAGE_KEY_ADMIN_AGENDA, JSON.stringify(notes));
}

export async function loadAllAdminNotes(residencia?: Residencia): Promise<{
  data: AdminNote[];
  source: 'supabase' | 'local';
}> {
  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      const targetRes = residencia || 'ucanca';

      // 1. Try querying 'daily_notes' table first
      let notesData: Record<string, unknown>[] | null = null;
      let queryError: unknown = null;

      try {
        let query = supabaseInstance
          .from('daily_notes')
          .select('*')
          .order('created_at', { ascending: false });

        if (residencia) {
          query = query.or(`residencia_id.eq.${targetRes},residencia.eq.${targetRes}`);
        }
        const res = await query;
        if (!res.error && res.data) {
          notesData = res.data;
        } else {
          queryError = res.error;
        }
      } catch (e) {
        queryError = e;
      }

      // 2. Fallback to 'admin_agenda_notes' if daily_notes failed or is empty
      if (!notesData || queryError) {
        try {
          let fallbackQuery = supabaseInstance
            .from('admin_agenda_notes')
            .select('*')
            .order('created_at', { ascending: false });

          if (residencia) {
            fallbackQuery = fallbackQuery.or(`residencia.eq.${targetRes},residencia_id.eq.${targetRes}`);
          }
          const fbRes = await fallbackQuery;
          if (!fbRes.error && fbRes.data) {
            notesData = fbRes.data;
          }
        } catch {
          // ignore
        }
      }

      if (notesData) {
        const mapped: AdminNote[] = notesData.map((row: Record<string, unknown>) => {
          const rowText = String(row.note_text || '');
          const rowTitle = row.title ? String(row.title) : rowText ? rowText.split('\n')[0] : 'Nota';
          const rowDesc = row.description ? String(row.description) : rowText && rowText !== rowTitle ? rowText : '';

          return {
            id: String(row.id),
            residencia: ((row.residencia_id || row.residencia || targetRes) as Residencia),
            title: rowTitle,
            description: rowDesc,
            category: (row.category as AdminNoteCategory) || 'general',
            author: String(row.author || 'Residente'),
            priority: (row.priority as AdminNotePriority) || 'normal',
            status: (row.status as AdminNoteStatus) || 'pendiente',
            targetDate: String(row.date || row.target_date || formatDateToISO(new Date())),
            createdAt: String(row.created_at || new Date().toISOString()),
            updatedAt: row.updated_at ? String(row.updated_at) : undefined,
            calledInAt: row.called_in_at ? String(row.called_in_at) : undefined,
            responseNotes: row.response_notes ? String(row.response_notes) : undefined,
          };
        });

        // Filter strictly by active residence
        const filteredMapped = mapped.filter((n) => n.residencia === targetRes);

        const currentAll = getLocalAdminNotes();
        const otherNotes = currentAll.filter((n) => n.residencia !== targetRes);
        saveLocalAdminNotes([...otherNotes, ...filteredMapped]);

        return { data: filteredMapped, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Error loading admin daily notes from Supabase:', err);
    }
  }
  return { data: getLocalAdminNotes(residencia), source: 'local' };
}

export async function saveAdminNote(note: AdminNote, residencia?: Residencia): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  const targetRes = note.residencia || residencia || 'ucanca';
  const entry: AdminNote = { ...note, residencia: targetRes };

  const current = getLocalAdminNotes();
  const index = current.findIndex((n) => n.id === entry.id);
  if (index >= 0) {
    current[index] = { ...entry, updatedAt: new Date().toISOString() };
  } else {
    current.unshift(entry);
  }
  saveLocalAdminNotes(current);

  if (supabaseInstance && currentConfig.isConfigured) {
    const formattedNoteText = entry.description ? `${entry.title}\n${entry.description}` : entry.title;
    const payload = {
      id: entry.id,
      residencia_id: entry.residencia,
      residencia: entry.residencia,
      date: entry.targetDate || formatDateToISO(new Date()),
      target_date: entry.targetDate || formatDateToISO(new Date()),
      note_text: formattedNoteText,
      title: entry.title,
      description: entry.description || '',
      category: entry.category,
      author: entry.author,
      priority: entry.priority,
      status: entry.status,
      created_at: entry.createdAt,
      updated_at: new Date().toISOString(),
      called_in_at: entry.calledInAt || null,
      response_notes: entry.responseNotes || null,
    };

    try {
      // 1. Try 'daily_notes'
      const { error: dailyErr } = await supabaseInstance.from('daily_notes').upsert(payload, { onConflict: 'id' });
      if (!dailyErr) {
        return { success: true, source: 'supabase' };
      }

      // 2. Fallback to 'admin_agenda_notes'
      const { error: adminErr } = await supabaseInstance.from('admin_agenda_notes').upsert(payload, { onConflict: 'id' });
      if (!adminErr) {
        return { success: true, source: 'supabase' };
      }
    } catch {
      return { success: true, source: 'local' };
    }
  }

  return { success: true, source: 'local' };
}

export async function deleteAdminNote(noteId: string, residencia?: Residencia): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  const current = getLocalAdminNotes().filter((n) => n.id !== noteId);
  saveLocalAdminNotes(current);

  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      await Promise.allSettled([
        supabaseInstance.from('daily_notes').delete().eq('id', noteId),
        supabaseInstance.from('admin_agenda_notes').delete().eq('id', noteId),
      ]);
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
export function getLocalAbsences(residencia?: Residencia): AbsenceRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_ABSENCES);
    if (data) {
      const parsed: AbsenceRecord[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        if (!residencia) return parsed;
        return parsed.filter((a) => (a.residencia || 'ucanca') === residencia);
      }
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveLocalAbsences(absences: AbsenceRecord[]) {
  localStorage.setItem(STORAGE_KEY_ABSENCES, JSON.stringify(absences));
}

export async function loadAllAbsences(residencia?: Residencia): Promise<{
  data: AbsenceRecord[];
  source: 'supabase' | 'local';
}> {
  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      const targetRes = residencia || 'ucanca';
      const allResidents = targetRes === 'ucanca' ? RESIDENTS_UCANCA : RESIDENTS_TAIBA;

      // 1. Try querying 'absences' table first
      let absencesData: Record<string, unknown>[] | null = null;
      let queryError: unknown = null;

      try {
        let query = supabaseInstance
          .from('absences')
          .select('*')
          .order('start_date', { ascending: true });

        if (residencia) {
          query = query.or(`residencia_id.eq.${targetRes},residencia.eq.${targetRes}`);
        }
        const res = await query;
        if (!res.error && res.data) {
          absencesData = res.data;
        } else {
          queryError = res.error;
        }
      } catch (e) {
        queryError = e;
      }

      // 2. Fallback to 'resident_absences' table
      if (!absencesData || queryError) {
        try {
          let fallbackQuery = supabaseInstance
            .from('resident_absences')
            .select('*')
            .order('start_date', { ascending: true });

          if (residencia) {
            fallbackQuery = fallbackQuery.or(`residencia.eq.${targetRes},residencia_id.eq.${targetRes}`);
          }
          const fbRes = await fallbackQuery;
          if (!fbRes.error && fbRes.data) {
            absencesData = fbRes.data;
          }
        } catch {
          // ignore
        }
      }

      if (absencesData) {
        const mapped: AbsenceRecord[] = absencesData.map((row: Record<string, unknown>) => {
          const rowResIdRaw = row.resident_id;
          let resIdNum = 1;
          let resName = String(row.resident_name || '');

          if (typeof rowResIdRaw === 'number') {
            resIdNum = rowResIdRaw;
            const matched = allResidents.find((r) => r.id === resIdNum);
            if (matched && !resName) resName = matched.name;
          } else if (typeof rowResIdRaw === 'string') {
            // Check if matches resident initials
            const matched = allResidents.find((r) => r.name.toLowerCase() === rowResIdRaw.toLowerCase());
            if (matched) {
              resIdNum = matched.id;
              resName = matched.name;
            } else {
              const parsedNum = parseInt(rowResIdRaw, 10);
              if (!isNaN(parsedNum)) {
                resIdNum = parsedNum;
              }
              if (!resName) resName = rowResIdRaw;
            }
          }

          return {
            id: String(row.id),
            residencia: ((row.residencia_id || row.residencia || targetRes) as Residencia),
            residentId: resIdNum,
            residentName: resName || `Residente ${resIdNum}`,
            startDate: String(row.start_date || ''),
            endDate: String(row.end_date || ''),
            reason: String(row.reason || ''),
            createdAt: String(row.created_at || new Date().toISOString()),
          };
        });

        // Filter strictly by active residence
        const filteredMapped = mapped.filter((a) => a.residencia === targetRes);

        const currentAll = getLocalAbsences();
        const otherAbsences = currentAll.filter((a) => a.residencia !== targetRes);
        saveLocalAbsences([...otherAbsences, ...filteredMapped]);

        return { data: filteredMapped, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Error loading absences from Supabase:', err);
    }
  }
  return { data: getLocalAbsences(residencia), source: 'local' };
}

export async function saveAbsence(absence: AbsenceRecord, residencia?: Residencia): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  const targetRes = absence.residencia || residencia || 'ucanca';
  const entry: AbsenceRecord = { ...absence, residencia: targetRes };

  const current = getLocalAbsences();
  const index = current.findIndex((a) => a.id === entry.id);
  if (index >= 0) {
    current[index] = entry;
  } else {
    current.push(entry);
  }
  saveLocalAbsences(current);

  if (supabaseInstance && currentConfig.isConfigured) {
    const payload = {
      id: entry.id,
      residencia_id: entry.residencia,
      residencia: entry.residencia,
      resident_id: entry.residentName || String(entry.residentId),
      resident_name: entry.residentName,
      start_date: entry.startDate,
      end_date: entry.endDate,
      reason: entry.reason || '',
      created_at: entry.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // 1. Try 'absences'
      const { error: absErr } = await supabaseInstance.from('absences').upsert(payload, { onConflict: 'id' });
      if (!absErr) {
        return { success: true, source: 'supabase' };
      }

      // 2. Fallback to 'resident_absences'
      const fallbackPayload = {
        ...payload,
        resident_id: entry.residentId,
      };
      const { error: resAbsErr } = await supabaseInstance.from('resident_absences').upsert(fallbackPayload, { onConflict: 'id' });
      if (!resAbsErr) {
        return { success: true, source: 'supabase' };
      }
    } catch {
      return { success: true, source: 'local' };
    }
  }

  return { success: true, source: 'local' };
}

export async function deleteAbsence(absenceId: string, residencia?: Residencia): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  const current = getLocalAbsences().filter((a) => a.id !== absenceId);
  saveLocalAbsences(current);

  if (supabaseInstance && currentConfig.isConfigured) {
    try {
      await Promise.allSettled([
        supabaseInstance.from('absences').delete().eq('id', absenceId),
        supabaseInstance.from('resident_absences').delete().eq('id', absenceId),
      ]);
      return { success: true, source: 'supabase' };
    } catch {
      return { success: true, source: 'local' };
    }
  }

  return { success: true, source: 'local' };
}

export function getActiveSupabaseClient(): SupabaseClient | null {
  return supabaseInstance;
}


