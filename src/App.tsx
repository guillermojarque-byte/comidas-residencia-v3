import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { ResidentView } from './components/ResidentView';
import { KitchenView } from './components/KitchenView';
import { GuestsView } from './components/GuestsView';
import { AdminAgendaView } from './components/AdminAgendaView';
import { GuestModal } from './components/GuestModal';
import { AdminNoteModal } from './components/AdminNoteModal';
import { AbsenceModal } from './components/AbsenceModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { ResidentManagerModal } from './components/ResidentManagerModal';
import { 
  initializeSupabaseConfig, 
  loadAllPreferences, 
  saveDayPreference, 
  getStoredResidents, 
  saveStoredResidents,
  loadAllGuests,
  saveGuestEntry,
  deleteGuestEntry,
  loadAllAdminNotes,
  saveAdminNote,
  deleteAdminNote,
  loadAllAbsences,
  saveAbsence,
  deleteAbsence
} from './services/storageService';
import { 
  AbsenceRecord,
  AdminNote, 
  AdminNoteStatus, 
  DayOfWeek, 
  GuestEntry, 
  GuestMealType, 
  MealSelection, 
  Residencia,
  Resident, 
  ResidentWeeklySchedule, 
  SupabaseConfig 
} from './types';
import { DAYS, createDefaultWeekSchedule, RESIDENCIA_NAMES } from './constants';
import { getCurrentDayOfWeek, getDayISOString, isDayInAbsence } from './utils/dateUtils';
import { Users } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'resident' | 'kitchen' | 'guests' | 'admin_agenda'>('resident');
  
  const [activeResidencia, setActiveResidencia] = useState<Residencia>(() => {
    try {
      const saved = localStorage.getItem('comidas_active_residencia');
      if (saved === 'taiba' || saved === 'ucanca') return saved;
    } catch (e) {}
    return 'ucanca';
  });

  const [residents, setResidents] = useState<Resident[]>(() => getStoredResidents(activeResidencia));
  const [selectedResidentId, setSelectedResidentId] = useState<number>(() => {
    const initialRes = getStoredResidents(activeResidencia);
    return initialRes[0]?.id || 1;
  });
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => getCurrentDayOfWeek());
  const [weekOffset, setWeekOffset] = useState<number>(0);
  
  const [allPreferences, setAllPreferences] = useState<Record<number, ResidentWeeklySchedule>>({});
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    isConfigured: false,
  });
  const [syncSource, setSyncSource] = useState<'supabase' | 'local'>('local');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isResidentModalOpen, setIsResidentModalOpen] = useState<boolean>(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState<boolean>(false);
  const [isAdminNoteModalOpen, setIsAdminNoteModalOpen] = useState<boolean>(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState<boolean>(false);
  const [absenceInitialResidentId, setAbsenceInitialResidentId] = useState<number | undefined>(undefined);
  
  const [noteToEdit, setNoteToEdit] = useState<AdminNote | null>(null);
  const [initialNoteAuthor, setInitialNoteAuthor] = useState<string>('ILC');
  const [initialNoteDate, setInitialNoteDate] = useState<string | undefined>(undefined);

  const [guestModalPreset, setGuestModalPreset] = useState<{
    day: DayOfWeek;
    mealType: GuestMealType;
    hostName: string;
  }>({
    day: getCurrentDayOfWeek(),
    mealType: 'comida',
    hostName: 'ILC',
  });

  // Load data for active residence
  const loadResidencyData = async (residencia: Residencia) => {
    setIsLoading(true);
    const curResidents = getStoredResidents(residencia);
    setResidents(curResidents);
    setSelectedResidentId(curResidents[0]?.id || 1);

    const [resPref, resGuests, resNotes, resAbsences] = await Promise.all([
      loadAllPreferences(residencia),
      loadAllGuests(residencia),
      loadAllAdminNotes(residencia),
      loadAllAbsences(residencia),
    ]);

    setAllPreferences(resPref.data);
    setSyncSource(resPref.source);
    setGuests(resGuests.data);
    setAdminNotes(resNotes.data);
    setAbsences(resAbsences.data);
    setIsLoading(false);
  };

  // Switch residence handler
  const handleSelectResidencia = (newRes: Residencia) => {
    if (newRes === activeResidencia) return;
    setActiveResidencia(newRes);
    try {
      localStorage.setItem('comidas_active_residencia', newRes);
    } catch (e) {}
    loadResidencyData(newRes);
  };

  // Initialize and load
  useEffect(() => {
    const config = initializeSupabaseConfig();
    setSupabaseConfig(config);
    loadResidencyData(activeResidencia);
  }, []);

  // Week navigation controls
  const handlePreviousWeek = () => setWeekOffset((prev) => prev - 1);
  const handleNextWeek = () => setWeekOffset((prev) => prev + 1);
  const handleCurrentWeek = () => {
    setWeekOffset(0);
    setSelectedDay(getCurrentDayOfWeek());
  };
  const handleSetWeekOffset = (offset: number) => setWeekOffset(offset);

  // Current resident schedule
  const currentResidentSchedule = allPreferences[selectedResidentId] || createDefaultWeekSchedule();

  // Save single meal preference change
  const handleUpdateMealSelection = async (day: DayOfWeek, selection: MealSelection) => {
    const resObj = residents.find((r) => r.id === selectedResidentId);
    const residentName = resObj ? resObj.name : `Residente ${selectedResidentId}`;

    // Optimistic UI update
    setAllPreferences((prev) => {
      const currentSched = prev[selectedResidentId] || createDefaultWeekSchedule();
      return {
        ...prev,
        [selectedResidentId]: {
          ...currentSched,
          [day]: selection,
        },
      };
    });

    setIsSaving(true);
    const saveRes = await saveDayPreference(selectedResidentId, residentName, day, selection, activeResidencia);
    setSyncSource(saveRes.source);
    setIsSaving(false);
  };

  // Apply quick presets for whole week
  const handleApplyPreset = async (preset: 'all-home' | 'uni-tuppers' | 'weekend-out' | 'clear') => {
    const resObj = residents.find((r) => r.id === selectedResidentId);
    const residentName = resObj ? resObj.name : `Residente ${selectedResidentId}`;
    const newSchedule = createDefaultWeekSchedule();

    if (preset === 'all-home') {
      DAYS.forEach((d) => {
        newSchedule[d.id] = {
          desayuno_en_casa: true,
          comida_en_casa: true,
          comida_tupper: false,
          comida_segundo_turno: false,
          cena_en_casa: true,
          cena_tupper: false,
          cena_segundo_turno: false,
          observaciones: '',
        };
      });
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    } else if (preset === 'uni-tuppers') {
      DAYS.forEach((d) => {
        const isWeekday = !d.isWeekend;
        newSchedule[d.id] = {
          desayuno_en_casa: true,
          comida_en_casa: !isWeekday,
          comida_tupper: isWeekday,
          comida_segundo_turno: false,
          cena_en_casa: true,
          cena_tupper: false,
          cena_segundo_turno: false,
          observaciones: isWeekday ? 'Tupper para universidad' : '',
        };
      });
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    } else if (preset === 'weekend-out') {
      DAYS.forEach((d) => {
        newSchedule[d.id] = {
          desayuno_en_casa: !d.isWeekend,
          comida_en_casa: !d.isWeekend,
          comida_tupper: false,
          comida_segundo_turno: false,
          cena_en_casa: !d.isWeekend && d.id !== 'viernes',
          cena_tupper: false,
          cena_segundo_turno: false,
          observaciones: d.isWeekend ? 'Fuera el fin de semana' : '',
        };
      });
    } else if (preset === 'clear') {
      DAYS.forEach((d) => {
        newSchedule[d.id] = {
          desayuno_en_casa: false,
          comida_en_casa: false,
          comida_tupper: false,
          comida_segundo_turno: false,
          cena_en_casa: false,
          cena_tupper: false,
          cena_segundo_turno: false,
          observaciones: '',
        };
      });
    }

    setAllPreferences((prev) => ({
      ...prev,
      [selectedResidentId]: newSchedule,
    }));

    setIsSaving(true);
    // Save each day sequentially with active residence
    for (const d of DAYS) {
      await saveDayPreference(selectedResidentId, residentName, d.id, newSchedule[d.id], activeResidencia);
    }
    setIsSaving(false);
  };

  // Guest Management Handlers
  const handleOpenAddGuestModal = (day?: DayOfWeek, mealType?: GuestMealType, hostName?: string) => {
    const curRes = residents.find((r) => r.id === selectedResidentId);
    setGuestModalPreset({
      day: day || selectedDay,
      mealType: mealType || 'comida',
      hostName: hostName || curRes?.name || residents[0]?.name || 'ILC',
    });
    setIsGuestModalOpen(true);
  };

  const handleSaveGuest = async (newGuest: GuestEntry) => {
    const guestWithRes: GuestEntry = {
      ...newGuest,
      residencia: activeResidencia,
    };

    // Optimistic UI
    setGuests((prev) => {
      const idx = prev.findIndex((g) => g.id === guestWithRes.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = guestWithRes;
        return next;
      }
      return [...prev, guestWithRes];
    });

    setIsSaving(true);
    await saveGuestEntry(guestWithRes, activeResidencia);
    setIsSaving(false);
  };

  const handleDeleteGuest = async (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    setIsSaving(true);
    await deleteGuestEntry(id, activeResidencia);
    setIsSaving(false);
  };

  // Admin Agenda Notes Handlers
  const handleOpenAddAdminNoteModal = (author?: string, targetDate?: string) => {
    const curRes = residents.find((r) => r.id === selectedResidentId);
    setInitialNoteAuthor(author || curRes?.name || residents[0]?.name || 'ILC');
    setInitialNoteDate(targetDate || getDayISOString(selectedDay, weekOffset));
    setNoteToEdit(null);
    setIsAdminNoteModalOpen(true);
  };

  const handleEditAdminNote = (note: AdminNote) => {
    setNoteToEdit(note);
    setIsAdminNoteModalOpen(true);
  };

  const handleSaveAdminNote = async (newNote: AdminNote) => {
    const noteWithRes: AdminNote = {
      ...newNote,
      residencia: activeResidencia,
    };

    setAdminNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === noteWithRes.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = noteWithRes;
        return next;
      }
      return [noteWithRes, ...prev];
    });

    setIsSaving(true);
    await saveAdminNote(noteWithRes, activeResidencia);
    setIsSaving(false);
  };

  const handleDeleteAdminNote = async (id: string) => {
    setAdminNotes((prev) => prev.filter((n) => n.id !== id));
    setIsSaving(true);
    await deleteAdminNote(id, activeResidencia);
    setIsSaving(false);
  };

  const handleToggleAdminNoteStatus = async (note: AdminNote, nextStatus: AdminNoteStatus) => {
    const updated: AdminNote = {
      ...note,
      status: nextStatus,
      calledInAt: nextStatus === 'transmitido' ? new Date().toISOString() : note.calledInAt,
      updatedAt: new Date().toISOString(),
      residencia: activeResidencia,
    };

    setAdminNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    setIsSaving(true);
    await saveAdminNote(updated, activeResidencia);
    setIsSaving(false);
  };

  // Absence Management Handlers
  const handleOpenAbsenceModal = (initialResidentId?: number) => {
    setAbsenceInitialResidentId(initialResidentId || selectedResidentId);
    setIsAbsenceModalOpen(true);
  };

  const handleSaveAbsence = async (newAbsence: AbsenceRecord) => {
    const absWithRes: AbsenceRecord = {
      ...newAbsence,
      residencia: activeResidencia,
    };

    setAbsences((prev) => {
      const idx = prev.findIndex((a) => a.id === absWithRes.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = absWithRes;
        return next;
      }
      return [absWithRes, ...prev];
    });

    setIsSaving(true);
    await saveAbsence(absWithRes, activeResidencia);
    setIsSaving(false);
  };

  const handleDeleteAbsence = async (id: string) => {
    setAbsences((prev) => prev.filter((a) => a.id !== id));
    setIsSaving(true);
    await deleteAbsence(id, activeResidencia);
    setIsSaving(false);
  };

  const handleConfigUpdated = (newConfig: SupabaseConfig) => {
    setSupabaseConfig(newConfig);
    loadResidencyData(activeResidencia);
  };

  const handleSaveResidents = (newResidents: Resident[]) => {
    setResidents(newResidents);
    saveStoredResidents(newResidents, activeResidencia);
  };

  const guestCountTotal = guests.reduce((sum, g) => sum + g.count, 0);
  const pendingAdminNotesCount = adminNotes.filter((n) => n.status === 'pendiente').length;

  // Calculate confirmed physical residents on the selected day factoring in absences
  const confirmedResidentsCount = useMemo(() => {
    return residents.filter((r) => {
      const isAbsent = isDayInAbsence(selectedDay, weekOffset, absences, r.id);
      if (isAbsent) return false;

      const sched = allPreferences[r.id];
      if (!sched) return false;
      const dayPref = sched[selectedDay];
      if (!dayPref) return false;
      return Boolean(
        dayPref.desayuno_en_casa ||
        dayPref.comida_en_casa ||
        dayPref.comida_tupper ||
        dayPref.cena_en_casa ||
        dayPref.cena_tupper
      );
    }).length;
  }, [residents, allPreferences, selectedDay, weekOffset, absences]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeResidencia={activeResidencia}
        onSelectResidencia={handleSelectResidencia}
        supabaseConfig={supabaseConfig}
        onOpenSettings={() => setIsConfigModalOpen(true)}
        syncSource={syncSource}
        isSaving={isSaving}
        guestCountTotal={guestCountTotal}
        pendingAdminNotesCount={pendingAdminNotesCount}
        confirmedResidentsCount={confirmedResidentsCount}
        totalResidentsCount={residents.length}
        selectedDay={selectedDay}
        weekOffset={weekOffset}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        
        {/* Loading skeleton */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200 space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-slate-600">
              Cargando datos de comidas de la {RESIDENCIA_NAMES[activeResidencia]}...
            </p>
          </div>
        ) : (
          <>
            {currentTab === 'resident' && (
              <ResidentView
                residents={residents}
                selectedResidentId={selectedResidentId}
                onSelectResident={setSelectedResidentId}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                weekOffset={weekOffset}
                onSetWeekOffset={handleSetWeekOffset}
                onPreviousWeek={handlePreviousWeek}
                onNextWeek={handleNextWeek}
                onCurrentWeek={handleCurrentWeek}
                weeklySchedule={currentResidentSchedule}
                onUpdateMealSelection={handleUpdateMealSelection}
                onApplyPreset={handleApplyPreset}
                guests={guests}
                onOpenAddGuestModal={handleOpenAddGuestModal}
                onDeleteGuest={handleDeleteGuest}
                absences={absences}
                onOpenAbsenceModal={handleOpenAbsenceModal}
                isSaving={isSaving}
                syncSource={syncSource}
                confirmedResidentsCount={confirmedResidentsCount}
              />
            )}

            {currentTab === 'kitchen' && (
              <KitchenView
                residents={residents}
                allPreferences={allPreferences}
                guests={guests}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                weekOffset={weekOffset}
                onSetWeekOffset={handleSetWeekOffset}
                onPreviousWeek={handlePreviousWeek}
                onNextWeek={handleNextWeek}
                onCurrentWeek={handleCurrentWeek}
                absences={absences}
                onOpenAbsenceModal={handleOpenAbsenceModal}
                onOpenAddGuestModal={handleOpenAddGuestModal}
                onDeleteGuest={handleDeleteGuest}
                syncSource={syncSource}
                activeResidencia={activeResidencia}
              />
            )}

            {currentTab === 'guests' && (
              <GuestsView
                guests={guests}
                residents={residents}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                weekOffset={weekOffset}
                onSetWeekOffset={handleSetWeekOffset}
                onPreviousWeek={handlePreviousWeek}
                onNextWeek={handleNextWeek}
                onCurrentWeek={handleCurrentWeek}
                onOpenAddModal={(day, mealType, host) => handleOpenAddGuestModal(day, mealType, host)}
                onDeleteGuest={handleDeleteGuest}
              />
            )}

            {currentTab === 'admin_agenda' && (
              <AdminAgendaView
                notes={adminNotes}
                residents={residents}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                weekOffset={weekOffset}
                onSetWeekOffset={handleSetWeekOffset}
                onPreviousWeek={handlePreviousWeek}
                onNextWeek={handleNextWeek}
                onCurrentWeek={handleCurrentWeek}
                onOpenAddModal={handleOpenAddAdminNoteModal}
                onEditNote={handleEditAdminNote}
                onDeleteNote={handleDeleteAdminNote}
                onToggleStatus={handleToggleAdminNoteStatus}
                syncSource={syncSource}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <span>🍽️ Gestión de Comidas ({RESIDENCIA_NAMES[activeResidencia]} - {residents.length} residentes)</span>
          <span>•</span>
          <button
            onClick={() => setIsResidentModalOpen(true)}
            className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Lista de Residentes</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-medium">
            {syncSource === 'supabase' && supabaseConfig.isConfigured ? '🟢 Supabase Sincronizado' : '🟡 Modo Local'}
          </span>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="text-slate-600 hover:text-slate-900 font-semibold hover:underline"
          >
            Ajustes Conexión
          </button>
        </div>
      </footer>

      {/* Modals */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        currentConfig={supabaseConfig}
        onConfigUpdated={handleConfigUpdated}
      />

      <ResidentManagerModal
        isOpen={isResidentModalOpen}
        onClose={() => setIsResidentModalOpen(false)}
        residents={residents}
        activeResidencia={activeResidencia}
        onSaveResidents={handleSaveResidents}
      />

      <GuestModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        residents={residents}
        initialDay={guestModalPreset.day}
        initialMealType={guestModalPreset.mealType}
        initialHostName={guestModalPreset.hostName}
        onSaveGuest={handleSaveGuest}
      />

      <AdminNoteModal
        isOpen={isAdminNoteModalOpen}
        onClose={() => setIsAdminNoteModalOpen(false)}
        noteToEdit={noteToEdit}
        residents={residents}
        initialAuthor={initialNoteAuthor}
        initialDate={initialNoteDate}
        onSaveNote={handleSaveAdminNote}
      />

      <AbsenceModal
        isOpen={isAbsenceModalOpen}
        onClose={() => setIsAbsenceModalOpen(false)}
        residents={residents}
        absences={absences}
        initialResidentId={absenceInitialResidentId}
        onSaveAbsence={handleSaveAbsence}
        onDeleteAbsence={handleDeleteAbsence}
      />

    </div>
  );
}
