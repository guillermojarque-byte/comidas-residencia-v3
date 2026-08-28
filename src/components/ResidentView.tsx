import React from 'react';
import { 
  Check, 
  Coffee, 
  UtensilsCrossed, 
  Moon, 
  Package, 
  Clock, 
  Home, 
  CheckCheck, 
  Sparkles, 
  RotateCcw, 
  Briefcase, 
  MessageSquare,
  ChevronRight,
  Calendar,
  Users,
  Plus,
  Trash2,
  Plane,
  AlertCircle
} from 'lucide-react';
import { DAYS, DEFAULT_MEAL_SELECTION, GUEST_MENU_LABELS, GUEST_SERVICE_LABELS } from '../constants';
import { AbsenceRecord, DayOfWeek, GuestEntry, GuestMealType, MealSelection, Resident, ResidentWeeklySchedule } from '../types';
import { 
  getDayShortFormatted, 
  getDayFullFormatted, 
  getDayDateOnly, 
  isDayInAbsence,
  isDayToday,
  formatDateDDMMYY,
  parseISODate,
  getWeekRangeLabel
} from '../utils/dateUtils';
import { WeekNavigator } from './WeekNavigator';

interface ResidentViewProps {
  residents: Resident[];
  selectedResidentId: number;
  onSelectResident: (id: number) => void;
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  weekOffset: number;
  onSetWeekOffset: (offset: number) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  weeklySchedule: ResidentWeeklySchedule;
  onUpdateMealSelection: (day: DayOfWeek, selection: MealSelection) => void;
  onApplyPreset: (preset: 'all-home' | 'uni-tuppers' | 'weekend-out' | 'clear') => void;
  guests: GuestEntry[];
  onOpenAddGuestModal: (day: DayOfWeek, mealType?: GuestMealType, hostName?: string) => void;
  onDeleteGuest: (id: string) => void;
  absences: AbsenceRecord[];
  onOpenAbsenceModal: (initialResidentId?: number) => void;
  isSaving: boolean;
  syncSource: 'supabase' | 'local';
  confirmedResidentsCount?: number;
}

export const ResidentView: React.FC<ResidentViewProps> = ({
  residents,
  selectedResidentId,
  onSelectResident,
  selectedDay,
  onSelectDay,
  weekOffset,
  onSetWeekOffset,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  weeklySchedule,
  onUpdateMealSelection,
  onApplyPreset,
  guests,
  onOpenAddGuestModal,
  onDeleteGuest,
  absences,
  onOpenAbsenceModal,
  isSaving,
  syncSource,
  confirmedResidentsCount,
}) => {
  const currentResident = residents.find((r) => r.id === selectedResidentId) || residents[0];
  
  // Check if current resident is absent on the selected day
  const residentAbsenceToday = isDayInAbsence(selectedDay, weekOffset, absences, currentResident.id);

  const currentDayData: MealSelection = weeklySchedule[selectedDay] || {
    desayuno_en_casa: true,
    comida_en_casa: true,
    comida_tupper: false,
    comida_segundo_turno: false,
    cena_en_casa: true,
    cena_tupper: false,
    cena_segundo_turno: false,
    observaciones: '',
  };

  // Guests associated with this resident on this day
  const residentGuestsOnDay = guests.filter(
    (g) => g.day === selectedDay && g.hostName === currentResident.name
  );

  const setDesayuno = (val: boolean) => {
    onUpdateMealSelection(selectedDay, {
      ...currentDayData,
      desayuno_en_casa: val,
    });
  };

  const getComidaState = (): 'si' | 'segundo_turno' | 'tupper' | 'no' => {
    if (currentDayData.comida_tupper) return 'tupper';
    if (currentDayData.comida_en_casa && currentDayData.comida_segundo_turno) return 'segundo_turno';
    if (currentDayData.comida_en_casa) return 'si';
    return 'no';
  };

  const setComidaState = (mode: 'si' | 'segundo_turno' | 'tupper' | 'no') => {
    switch (mode) {
      case 'si':
        onUpdateMealSelection(selectedDay, {
          ...currentDayData,
          comida_en_casa: true,
          comida_segundo_turno: false,
          comida_tupper: false,
        });
        break;
      case 'segundo_turno':
        onUpdateMealSelection(selectedDay, {
          ...currentDayData,
          comida_en_casa: true,
          comida_segundo_turno: true,
          comida_tupper: false,
        });
        break;
      case 'tupper':
        onUpdateMealSelection(selectedDay, {
          ...currentDayData,
          comida_en_casa: false,
          comida_segundo_turno: false,
          comida_tupper: true,
        });
        break;
      case 'no':
        onUpdateMealSelection(selectedDay, {
          ...currentDayData,
          comida_en_casa: false,
          comida_segundo_turno: false,
          comida_tupper: false,
        });
        break;
    }
  };

  const getCenaState = (): 'si' | 'segundo_turno' | 'tupper' | 'no' => {
    if (currentDayData.cena_tupper) return 'tupper';
    if (currentDayData.cena_en_casa && currentDayData.cena_segundo_turno) return 'segundo_turno';
    if (currentDayData.cena_en_casa) return 'si';
    return 'no';
  };

  const setCenaState = (mode: 'si' | 'segundo_turno' | 'tupper' | 'no') => {
    switch (mode) {
      case 'si':
        onUpdateMealSelection(selectedDay, {
          ...currentDayData,
          cena_en_casa: true,
          cena_segundo_turno: false,
          cena_tupper: false,
        });
        break;
      case 'segundo_turno':
        onUpdateMealSelection(selectedDay, {
          ...currentDayData,
          cena_en_casa: true,
          cena_segundo_turno: true,
          cena_tupper: false,
        });
        break;
      case 'tupper':
        onUpdateMealSelection(selectedDay, {
          ...currentDayData,
          cena_en_casa: false,
          cena_segundo_turno: false,
          cena_tupper: true,
        });
        break;
      case 'no':
        onUpdateMealSelection(selectedDay, {
          ...currentDayData,
          cena_en_casa: false,
          cena_segundo_turno: false,
          cena_tupper: false,
        });
        break;
    }
  };

  const handleObservaciones = (text: string) => {
    onUpdateMealSelection(selectedDay, {
      ...currentDayData,
      observaciones: text,
    });
  };

  // Calculate week stats for this resident
  const totalTuppers = (Object.values(weeklySchedule) as MealSelection[]).reduce((acc: number, curr: MealSelection) => {
    return acc + (curr.comida_tupper ? 1 : 0) + (curr.cena_tupper ? 1 : 0);
  }, 0);

  const totalLateShifts = (Object.values(weeklySchedule) as MealSelection[]).reduce((acc: number, curr: MealSelection) => {
    return acc + (curr.comida_segundo_turno ? 1 : 0) + (curr.cena_segundo_turno ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Selector de Residente (Iniciales) */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Selector de Iniciales */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="resident-select-input" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Selecciona tu Residente (Iniciales):
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAbsenceModal(currentResident.id)}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  title="Registrar viaje o ausencia para anular automáticamente servicios"
                >
                  <Plane className="w-3.5 h-3.5 text-amber-700" />
                  <span>Viajes / Ausencias</span>
                </button>
                <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                  {residents.length} Residentes
                </span>
              </div>
            </div>

            {/* Quick Initial Chips */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
              {residents.map((res) => {
                const isSelected = res.id === selectedResidentId;
                const isAbsentToday = isDayInAbsence(selectedDay, weekOffset, absences, res.id);

                return (
                  <button
                    key={res.id}
                    onClick={() => onSelectResident(res.id)}
                    className={`py-2.5 rounded-xl font-black text-sm transition-all border text-center relative ${
                      isSelected
                        ? 'bg-slate-900 text-emerald-400 border-slate-900 shadow-md ring-2 ring-emerald-500/50 scale-105'
                        : isAbsentToday
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {res.name}
                    {isAbsentToday && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white" title="Ausente por viaje"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen rápido del residente */}
          <div className="flex items-center justify-around sm:justify-end gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 shrink-0">
            <div className="text-center px-3 py-1">
              <span className="text-xs text-slate-500 font-medium block">Residentes Hoy</span>
              <span className="text-base font-extrabold text-emerald-700">
                {confirmedResidentsCount !== undefined ? confirmedResidentsCount : residents.length} / {residents.length}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-center px-3 py-1">
              <span className="text-xs text-slate-500 font-medium block">Tuppers Sem.</span>
              <span className="text-base font-extrabold text-indigo-700">{totalTuppers}</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-center px-3 py-1">
              <span className="text-xs text-slate-500 font-medium block">2º Turno Sem.</span>
              <span className="text-base font-extrabold text-amber-700">{totalLateShifts}</span>
            </div>
          </div>

        </div>

        {/* Atajos para toda la semana */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Atajos rápidos para {currentResident.name}:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onApplyPreset('all-home')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Toda la semana en comedor</span>
            </button>

            <button
              onClick={() => onApplyPreset('uni-tuppers')}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Tuppers L-V (Univ/Trabajo)</span>
            </button>

            <button
              onClick={() => onApplyPreset('weekend-out')}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Fines de semana fuera</span>
            </button>

            <button
              onClick={() => onApplyPreset('clear')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Week Navigator */}
      <WeekNavigator
        weekOffset={weekOffset}
        onSetWeekOffset={onSetWeekOffset}
        onPreviousWeek={onPreviousWeek}
        onNextWeek={onNextWeek}
        onCurrentWeek={onCurrentWeek}
      />

      {/* Banner de Ausencia activa para el residente seleccionado */}
      {residentAbsenceToday && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-rose-950 text-sm">
                ✈️ Residente {currentResident.name} tiene ausencia registrada
              </div>
              <div className="text-rose-800">
                Periodo: Del <strong>{formatDateDDMMYY(parseISODate(residentAbsenceToday.startDate))}</strong> al <strong>{formatDateDDMMYY(parseISODate(residentAbsenceToday.endDate))}</strong> ({residentAbsenceToday.reason || 'Viaje / Fuera de residencia'})
              </div>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Sus comidas han sido anuladas automáticamente en los cómputos de cocina para este periodo.
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenAbsenceModal(currentResident.id)}
            className="px-3.5 py-1.5 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 font-extrabold rounded-xl shrink-0 transition"
          >
            Modificar / Cancelar Ausencia
          </button>
        </div>
      )}

      {/* Selector de Día (Lunes a Domingo con fecha dinámica) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Día de la semana ({getWeekRangeLabel(weekOffset)}):
          </span>
          <span className="text-xs text-slate-400">
            {isSaving ? 'Guardando cambios...' : 'Guardado automáticamente'}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {DAYS.map((day) => {
            const isSelected = day.id === selectedDay;
            const isToday = isDayToday(day.id, weekOffset);
            const dayPref = weeklySchedule[day.id];
            const formattedDate = getDayDateOnly(day.id, weekOffset);
            const isAbsent = isDayInAbsence(day.id, weekOffset, absences, currentResident.id);

            return (
              <button
                key={day.id}
                onClick={() => onSelectDay(day.id)}
                className={`py-2.5 px-2 rounded-xl text-center transition-all relative border flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/50'
                    : isAbsent
                    ? 'bg-rose-50/70 text-rose-800 border-rose-200'
                    : isToday
                    ? 'bg-emerald-50/70 text-slate-800 border-emerald-300 ring-1 ring-emerald-400/40'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                {isToday && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-emerald-600 text-white text-[9px] font-black rounded-full shadow-2xs tracking-wide">
                    HOY
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold block">{day.short}</span>
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-emerald-300' : isAbsent ? 'text-rose-700' : isToday ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {formattedDate}
                  </span>
                </div>
                <span className={`text-xs font-extrabold block ${isSelected ? 'text-emerald-400' : isAbsent ? 'text-rose-900' : 'text-slate-900'}`}>
                  {day.label}
                </span>

                {/* Status indicator dots */}
                <div className="flex items-center gap-1 mt-0.5">
                  {isAbsent ? (
                    <span className="text-[9px] font-black text-rose-600">VIAJE</span>
                  ) : (
                    <>
                      {dayPref?.desayuno_en_casa && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Desayuno"></span>
                      )}
                      {(dayPref?.comida_en_casa || dayPref?.comida_tupper) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Comida"></span>
                      )}
                      {(dayPref?.cena_en_casa || dayPref?.cena_tupper) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" title="Cena"></span>
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tarjeta de Formulario de Comidas para el día actual */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
        
        {/* Cabecera del Día */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-sm shadow-sm">
              {currentResident.name}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 capitalize">
                {getDayFullFormatted(selectedDay, weekOffset)}
              </h2>
              <p className="text-xs text-slate-500">
                Selección para el residente <strong className="text-slate-800">{currentResident.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>Autoguardado</span>
            </span>
          </div>
        </div>

        {/* 3 Columnas de Comidas: Desayuno, Comida, Cena */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. DESAYUNO (Sí o No) */}
          <div className="bg-amber-50/40 rounded-2xl p-5 border border-amber-200/80 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Desayuno</h3>
                    <span className="text-[11px] text-amber-800 font-medium">07:30 - 09:30</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Mañana
                </span>
              </div>

              <p className="text-xs text-slate-600">
                ¿Desayunas en la residencia este día?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDesayuno(true)}
                className={`py-3 px-3 rounded-xl border text-center font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 ${
                  currentDayData.desayuno_en_casa
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/50'
                    : 'bg-white text-slate-700 hover:bg-amber-50/40 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>✓ Sí (Comedor)</span>
                </div>
                <span className={`text-[10px] font-normal ${currentDayData.desayuno_en_casa ? 'text-amber-100' : 'text-slate-500'}`}>
                  En comedor
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDesayuno(false)}
                className={`py-3 px-3 rounded-xl border text-center font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 ${
                  !currentDayData.desayuno_en_casa
                    ? 'bg-slate-800 text-white border-slate-900 shadow-sm ring-2 ring-slate-400/50'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>✕ No</span>
                </div>
                <span className={`text-[10px] font-normal ${!currentDayData.desayuno_en_casa ? 'text-slate-300' : 'text-slate-500'}`}>
                  No desayuna
                </span>
              </button>
            </div>
          </div>

          {/* 2. COMIDA (1er Turno, 2º Turno, Para llevar, No) */}
          <div className="bg-emerald-50/40 rounded-2xl p-5 border border-emerald-200/80 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Comida</h3>
                    <span className="text-[11px] text-emerald-800 font-medium">13:30 - 15:30</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Mediodía
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Selecciona tu opción para el almuerzo:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setComidaState('si')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  getComidaState() === 'si'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400/50'
                    : 'bg-white text-slate-700 hover:bg-emerald-50/30 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">✓ Sí (Comedor)</span>
                  {getComidaState() === 'si' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-[10px] mt-1 ${getComidaState() === 'si' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  1er turno (13:30)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setComidaState('segundo_turno')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  getComidaState() === 'segundo_turno'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400/50'
                    : 'bg-white text-slate-700 hover:bg-amber-50/30 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    2º Turno
                  </span>
                  {getComidaState() === 'segundo_turno' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-[10px] mt-1 ${getComidaState() === 'segundo_turno' ? 'text-amber-100' : 'text-slate-400'}`}>
                  Comer tarde (14:45)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setComidaState('tupper')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  getComidaState() === 'tupper'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-400/50'
                    : 'bg-white text-slate-700 hover:bg-indigo-50/30 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    Para llevar
                  </span>
                  {getComidaState() === 'tupper' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-[10px] mt-1 ${getComidaState() === 'tupper' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Tupper preparado
                </span>
              </button>

              <button
                type="button"
                onClick={() => setComidaState('no')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  getComidaState() === 'no'
                    ? 'bg-slate-800 text-white border-slate-900 shadow-sm ring-2 ring-slate-400/50'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">✕ No</span>
                  {getComidaState() === 'no' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-[10px] mt-1 ${getComidaState() === 'no' ? 'text-slate-300' : 'text-slate-400'}`}>
                  No come aquí
                </span>
              </button>
            </div>
          </div>

          {/* 3. CENA (1er Turno, 2º Turno, Para llevar, No) */}
          <div className="bg-indigo-50/40 rounded-2xl p-5 border border-indigo-200/80 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-800">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Cena</h3>
                    <span className="text-[11px] text-indigo-800 font-medium">20:30 - 22:00</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Noche
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Selecciona tu opción para la cena:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCenaState('si')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  getCenaState() === 'si'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-400/50'
                    : 'bg-white text-slate-700 hover:bg-indigo-50/30 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">✓ Sí (Comedor)</span>
                  {getCenaState() === 'si' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-[10px] mt-1 ${getCenaState() === 'si' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  1er turno (20:30)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCenaState('segundo_turno')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  getCenaState() === 'segundo_turno'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400/50'
                    : 'bg-white text-slate-700 hover:bg-amber-50/30 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    2º Turno
                  </span>
                  {getCenaState() === 'segundo_turno' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-[10px] mt-1 ${getCenaState() === 'segundo_turno' ? 'text-amber-100' : 'text-slate-400'}`}>
                  Cenar tarde (21:30)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCenaState('tupper')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  getCenaState() === 'tupper'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-sm ring-2 ring-purple-400/50'
                    : 'bg-white text-slate-700 hover:bg-purple-50/30 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    Para llevar
                  </span>
                  {getCenaState() === 'tupper' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-[10px] mt-1 ${getCenaState() === 'tupper' ? 'text-purple-100' : 'text-slate-400'}`}>
                  Tupper preparado
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCenaState('no')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  getCenaState() === 'no'
                    ? 'bg-slate-800 text-white border-slate-900 shadow-sm ring-2 ring-slate-400/50'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">✕ No</span>
                  {getCenaState() === 'no' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-[10px] mt-1 ${getCenaState() === 'no' ? 'text-slate-300' : 'text-slate-400'}`}>
                  No cena aquí
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Sección de Invitados del Residente para este día */}
        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Invitados / Comensales extra de {currentResident.name} ({DAYS.find((d) => d.id === selectedDay)?.label}):
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenAddGuestModal(selectedDay, 'comida', currentResident.name)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Traer Invitado</span>
            </button>
          </div>

          {residentGuestsOnDay.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No tienes invitados registrados para este día. Si viene alguien contigo a comer o cenar, pulsa en "+ Traer Invitado".
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {residentGuestsOnDay.map((g) => {
                const menu = GUEST_MENU_LABELS[g.menuType] || GUEST_MENU_LABELS.estandar;
                return (
                  <div
                    key={g.id}
                    className="bg-white rounded-xl p-3 border border-indigo-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="capitalize">{g.mealType}</span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px]">
                          {g.count} {g.count === 1 ? 'persona' : 'personas'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {GUEST_SERVICE_LABELS[g.serviceMode]} • <span className="font-semibold text-slate-700">{menu.label}</span>
                      </div>
                      {g.dietNotes && <div className="text-[10px] text-rose-600 font-medium">⚠️ {g.dietNotes}</div>}
                    </div>

                    <button
                      onClick={() => onDeleteGuest(g.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition"
                      title="Eliminar invitado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Observaciones / Notas para Cocina */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <label htmlFor="notes-day-input" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Observaciones para el personal de cocina ({DAYS.find((d) => d.id === selectedDay)?.label}):
            </label>
          </div>
          <input
            id="notes-day-input"
            type="text"
            value={currentDayData.observaciones || ''}
            onChange={(e) => handleObservaciones(e.target.value)}
            placeholder="Ej: Llego a las 15:15 por examen, o dejar plato sin frutos secos..."
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
          />
        </div>

      </div>

      {/* Resumen Semanal del Residente */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>📅 Plan Semanal de {currentResident.name} ({getWeekRangeLabel(weekOffset)})</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px]">
                <th className="p-2.5 rounded-l-lg">Día</th>
                <th className="p-2.5 text-center">☕ Desayuno</th>
                <th className="p-2.5 text-center">🍲 Comida</th>
                <th className="p-2.5 text-center">🌙 Cena</th>
                <th className="p-2.5 rounded-r-lg">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DAYS.map((d) => {
                const s = weeklySchedule[d.id] || DEFAULT_MEAL_SELECTION;
                const isCur = d.id === selectedDay;
                const isAbsent = isDayInAbsence(d.id, weekOffset, absences, currentResident.id);

                return (
                  <tr
                    key={d.id}
                    onClick={() => onSelectDay(d.id)}
                    className={`cursor-pointer transition ${
                      isCur ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-2.5 font-bold text-slate-800 flex items-center gap-1.5">
                      {isCur && <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />}
                      <span>{getDayShortFormatted(d.id, weekOffset)}</span>
                    </td>
                    <td className="p-2.5 text-center">
                      {isAbsent ? (
                        <span className="text-rose-600 font-bold">Viaje</span>
                      ) : s.desayuno_en_casa ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">Comedor</span>
                      ) : (
                        <span className="text-slate-300">No</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center space-x-1">
                      {isAbsent ? (
                        <span className="text-rose-600 font-bold">Viaje</span>
                      ) : (
                        <>
                          {s.comida_en_casa && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Comedor</span>
                          )}
                          {s.comida_tupper && (
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">Tupper</span>
                          )}
                          {s.comida_segundo_turno && (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">2º Turno</span>
                          )}
                          {!s.comida_en_casa && !s.comida_tupper && (
                            <span className="text-slate-300">No</span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="p-2.5 text-center space-x-1">
                      {isAbsent ? (
                        <span className="text-rose-600 font-bold">Viaje</span>
                      ) : (
                        <>
                          {s.cena_en_casa && (
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">Comedor</span>
                          )}
                          {s.cena_tupper && (
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">Tupper</span>
                          )}
                          {s.cena_segundo_turno && (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">2º Turno</span>
                          )}
                          {!s.cena_en_casa && !s.cena_tupper && (
                            <span className="text-slate-300">No</span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-500 truncate max-w-[150px]">
                      {isAbsent ? (
                        <span className="text-rose-700 font-bold">Ausente: {isAbsent.reason || 'Viaje'}</span>
                      ) : (
                        s.observaciones || '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
