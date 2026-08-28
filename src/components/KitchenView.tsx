import React, { useState } from 'react';
import { 
  Utensils, 
  Printer, 
  Coffee, 
  UtensilsCrossed, 
  Moon, 
  Package, 
  Clock, 
  Calendar, 
  Users, 
  Plus, 
  Trash2,
  Maximize2,
  Minimize2,
  Check,
  X,
  AlertCircle,
  Sunrise,
  ArrowRight,
  ShieldCheck,
  Plane,
  CheckCircle2
} from 'lucide-react';
import { DAYS, GUEST_MENU_LABELS, GUEST_SERVICE_LABELS } from '../constants';
import { AbsenceRecord, DayOfWeek, GuestEntry, GuestMealType, Residencia, Resident, ResidentWeeklySchedule } from '../types';
import { 
  getDayShortFormatted, 
  getDayFullFormatted, 
  getDayDateOnly, 
  getNextDayOfWeek, 
  formatMealsSummary,
  isDayInAbsence,
  isDayToday,
  getWeekRangeLabel
} from '../utils/dateUtils';
import { WeekNavigator } from './WeekNavigator';
import { RESIDENCIA_BADGES } from '../constants';

interface KitchenViewProps {
  residents: Resident[];
  allPreferences: Record<number, ResidentWeeklySchedule>;
  guests: GuestEntry[];
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  weekOffset: number;
  onSetWeekOffset: (offset: number) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  absences: AbsenceRecord[];
  onOpenAbsenceModal: (initialResidentId?: number) => void;
  onOpenAddGuestModal: (day: DayOfWeek, mealType?: GuestMealType) => void;
  onDeleteGuest: (id: string) => void;
  syncSource: 'supabase' | 'local';
  activeResidencia?: Residencia;
}

export const KitchenView: React.FC<KitchenViewProps> = ({
  residents,
  allPreferences,
  guests,
  selectedDay,
  onSelectDay,
  weekOffset,
  onSetWeekOffset,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  absences,
  onOpenAbsenceModal,
  onOpenAddGuestModal,
  onDeleteGuest,
  syncSource,
  activeResidencia = 'ucanca',
}) => {
  const [kitchenMode, setKitchenMode] = useState<'day' | 'week' | 'board'>('day');
  const resBadge = RESIDENCIA_BADGES[activeResidencia];

  // Compute daily totals including guests and factoring in absences
  const computeDayTotals = (day: DayOfWeek, offset: number = weekOffset) => {
    // 1. Resident counts
    let resDesayuno = 0;
    let resComida1 = 0;
    let resComida2 = 0;
    let resComidaTupper = 0;
    let resCena1 = 0;
    let resCena2 = 0;
    let resCenaTupper = 0;
    let resAbsentCount = 0;

    residents.forEach((r) => {
      // Check if resident is absent on this day
      const absence = isDayInAbsence(day, offset, absences, r.id);
      if (absence) {
        resAbsentCount++;
        return; // No meals counted for absent resident
      }

      const schedule = allPreferences[r.id];
      const dayData = schedule ? schedule[day] : null;

      if (dayData) {
        if (dayData.desayuno_en_casa) resDesayuno++;
        
        if (dayData.comida_tupper) {
          resComidaTupper++;
        } else if (dayData.comida_en_casa) {
          if (dayData.comida_segundo_turno) resComida2++;
          else resComida1++;
        }

        if (dayData.cena_tupper) {
          resCenaTupper++;
        } else if (dayData.cena_en_casa) {
          if (dayData.cena_segundo_turno) resCena2++;
          else resCena1++;
        }
      }
    });

    const resComidaTotal = resComida1 + resComida2 + resComidaTupper;
    const resCenaTotal = resCena1 + resCena2 + resCenaTupper;

    // 2. Guest counts for this day
    const dayGuests = guests.filter((g) => g.day === day);
    let guestDesayuno = 0;
    let guestComida1 = 0;
    let guestComida2 = 0;
    let guestComidaTupper = 0;
    let guestCena1 = 0;
    let guestCena2 = 0;
    let guestCenaTupper = 0;

    dayGuests.forEach((g) => {
      if (g.mealType === 'desayuno') {
        guestDesayuno += g.count;
      } else if (g.mealType === 'comida') {
        if (g.serviceMode === 'tupper') guestComidaTupper += g.count;
        else if (g.serviceMode === 'comedor_2') guestComida2 += g.count;
        else guestComida1 += g.count;
      } else if (g.mealType === 'cena') {
        if (g.serviceMode === 'tupper') guestCenaTupper += g.count;
        else if (g.serviceMode === 'comedor_2') guestCena2 += g.count;
        else guestCena1 += g.count;
      }
    });

    const guestComidaTotal = guestComida1 + guestComida2 + guestComidaTupper;
    const guestCenaTotal = guestCena1 + guestCena2 + guestCenaTupper;

    // 3. Combined Grand Totals
    const totalDesayuno = resDesayuno + guestDesayuno;
    const totalComida1 = resComida1 + guestComida1;
    const totalComida2 = resComida2 + guestComida2;
    const totalComidaTupper = resComidaTupper + guestComidaTupper;
    const totalComidaRaciones = resComidaTotal + guestComidaTotal;

    const totalCena1 = resCena1 + guestCena1;
    const totalCena2 = resCena2 + guestCena2;
    const totalCenaTupper = resCenaTupper + guestCenaTupper;
    const totalCenaRaciones = resCenaTotal + guestCenaTotal;

    const granTotalDia = totalDesayuno + totalComidaRaciones + totalCenaRaciones;

    return {
      resDesayuno,
      guestDesayuno,
      totalDesayuno,
      resAbsentCount,

      resComida1,
      resComida2,
      resComidaTupper,
      resComidaTotal,
      guestComida1,
      guestComida2,
      guestComidaTupper,
      guestComidaTotal,
      totalComida1,
      totalComida2,
      totalComidaTupper,
      totalComidaRaciones,

      resCena1,
      resCena2,
      resCenaTupper,
      resCenaTotal,
      guestCena1,
      guestCena2,
      guestCenaTupper,
      guestCenaTotal,
      totalCena1,
      totalCena2,
      totalCenaTupper,
      totalCenaRaciones,

      granTotalDia,
      dayGuests,
    };
  };

  const dayTotals = computeDayTotals(selectedDay);
  const currentDayMeta = DAYS.find((d) => d.id === selectedDay);

  // Next day calculations for Dirección / Cocina morning preparation
  const nextDay = getNextDayOfWeek(selectedDay);
  const nextDayWeekOffset = selectedDay === 'domingo' ? weekOffset + 1 : weekOffset;
  const nextDayTotals = computeDayTotals(nextDay, nextDayWeekOffset);
  const nextDayMeta = DAYS.find((d) => d.id === nextDay);

  const residentsBreakfastNextDay = residents.filter((r) => {
    const isAbsent = isDayInAbsence(nextDay, nextDayWeekOffset, absences, r.id);
    if (isAbsent) return false;
    const sched = allPreferences[r.id];
    return sched?.[nextDay]?.desayuno_en_casa;
  });

  const residentsNoBreakfastNextDay = residents.filter((r) => {
    const isAbsent = isDayInAbsence(nextDay, nextDayWeekOffset, absences, r.id);
    if (isAbsent) return true;
    const sched = allPreferences[r.id];
    return !sched?.[nextDay]?.desayuno_en_casa;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Barra de Control de Cocina */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-xs flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5" />
              Panel de Cocina y Pedidos
            </span>
            <span className={`text-[11px] font-black px-2 py-0.5 rounded-md uppercase ${resBadge.tagColor}`}>
              {resBadge.name}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {residents.length} Residentes + Comensales Invitados
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Recuento Nominal de Raciones y Turnos — Residencia {resBadge.name}
          </h2>
        </div>

        {/* Modos de vista y acciones */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setKitchenMode('day')}
              className={`px-3 py-1.5 rounded-lg transition ${
                kitchenMode === 'day' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Turnos de Hoy
            </button>
            <button
              onClick={() => setKitchenMode('week')}
              className={`px-3 py-1.5 rounded-lg transition ${
                kitchenMode === 'week' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana Completa
            </button>
            <button
              onClick={() => setKitchenMode('board')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                kitchenMode === 'board' ? 'bg-slate-900 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              <span>Pizarra</span>
            </button>
          </div>

          {/* Absence Management Trigger */}
          <button
            onClick={() => onOpenAbsenceModal()}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            title="Registrar o consultar ausencias y viajes"
          >
            <Plane className="w-3.5 h-3.5 text-amber-700" />
            <span>Viajes / Ausencias ({absences.length})</span>
          </button>

          <button
            onClick={() => onOpenAddGuestModal(selectedDay)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Invitado</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            title="Imprimir para la cocina"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
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

      {/* Selector de Días (con cálculo dinámico según weekOffset) */}
      {kitchenMode !== 'week' && (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {DAYS.map((day) => {
            const isSelected = day.id === selectedDay;
            const isToday = isDayToday(day.id, weekOffset);
            const totals = computeDayTotals(day.id);
            const dateOnly = getDayDateOnly(day.id, weekOffset);
            const summaryBadge = formatMealsSummary(totals.totalDesayuno, totals.totalComidaRaciones, totals.totalCenaRaciones);

            return (
              <button
                key={day.id}
                onClick={() => onSelectDay(day.id)}
                className={`p-2.5 rounded-xl text-center transition-all border flex flex-col items-center justify-between gap-1.5 relative ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-500/50'
                    : isToday
                    ? 'bg-amber-50/60 text-slate-800 border-amber-300 ring-1 ring-amber-400/40'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                {isToday && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-amber-600 text-white text-[9px] font-black rounded-full shadow-2xs tracking-wide">
                    HOY
                  </span>
                )}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold">{day.short}</span>
                    <span className={`text-[10px] font-semibold ${isSelected ? 'text-amber-300' : isToday ? 'text-amber-800' : 'text-slate-500'}`}>
                      {dateOnly}
                    </span>
                  </div>
                  {totals.dayGuests.length > 0 && (
                    <span className="text-[9px] px-1 bg-indigo-500 text-white rounded font-bold">
                      +{totals.dayGuests.reduce((s, g) => s + g.count, 0)} inv
                    </span>
                  )}
                </div>

                <span className={`text-sm font-extrabold block ${isSelected ? 'text-amber-400' : 'text-slate-900'}`}>
                  {day.label}
                </span>

                <div className="w-full pt-1.5 border-t border-slate-100/20 text-[10px] font-black flex items-center justify-center">
                  <span className={isSelected ? 'text-amber-300' : isToday ? 'text-amber-900' : 'text-slate-700'} title="Desayunos · Comidas · Cenas">
                    {summaryBadge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 1: DÍA A DÍA / FLUJO DE COCINA                                   */}
      {/* ===================================================================== */}
      {kitchenMode === 'day' && (
        <div className="space-y-6">
          
          {/* Banner Resumen Ejecutivo */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-md border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block">
                  Plan de Cocina para Hoy
                </span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black px-2.5 py-0.5 rounded-full">
                  {formatMealsSummary(dayTotals.totalDesayuno, dayTotals.totalComidaRaciones, dayTotals.totalCenaRaciones)}
                </span>
                {dayTotals.resAbsentCount > 0 && (
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Plane className="w-3 h-3" />
                    <span>{dayTotals.resAbsentCount} ausente(s)</span>
                  </span>
                )}
              </div>
              
              <h3 className="text-2xl font-black text-white capitalize">
                {getDayFullFormatted(selectedDay, weekOffset)}
              </h3>
              
              <p className="text-xs text-slate-300">
                Gran Total: <strong className="text-emerald-400 text-sm">{dayTotals.granTotalDia} raciones</strong> para el día (
                <span className="text-amber-300 font-bold">
                  {dayTotals.guestDesayuno > 0 ? `${dayTotals.resDesayuno}D + ${dayTotals.guestDesayuno} Inv` : `${dayTotals.totalDesayuno}D`}
                </span>
                {' · '}
                <span className="text-emerald-300 font-bold">
                  {dayTotals.guestComidaTotal > 0 ? `${dayTotals.resComidaTotal}C + ${dayTotals.guestComidaTotal} Inv` : `${dayTotals.totalComidaRaciones}C`}
                </span>
                {' · '}
                <span className="text-indigo-300 font-bold">
                  {dayTotals.guestCenaTotal > 0 ? `${dayTotals.resCenaTotal}Cn + ${dayTotals.guestCenaTotal} Inv` : `${dayTotals.totalCenaRaciones}Cn`}
                </span>
                ).
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <div className="bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 text-center">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Tuppers</span>
                <span className="text-lg font-black text-indigo-400">
                  {dayTotals.totalComidaTupper + dayTotals.totalCenaTupper}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ({dayTotals.totalComidaTupper} com / {dayTotals.totalCenaTupper} cen)
                </span>
              </div>

              <div className="bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 text-center">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">2º Turno (Tardes)</span>
                <span className="text-lg font-black text-amber-400">
                  {dayTotals.totalComida2 + dayTotals.totalCena2}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ({dayTotals.totalComida2} com / {dayTotals.totalCena2} cen)
                </span>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* TARJETA DESTACADA: DESAYUNOS DEL DÍA SIGUIENTE                    */}
          {/* ================================================================= */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/60 border-2 border-amber-300/80 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/70 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm">
                  <Sunrise className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                      Preparación de Cocina / Dirección
                    </span>
                    <span className="text-xs text-amber-800 font-semibold">
                      Para dejar listo esta tarde/noche
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">
                    ☕ Desayunos de Mañana ({nextDayMeta?.label} {getDayDateOnly(nextDay, nextDayWeekOffset)})
                  </h3>
                </div>
              </div>

              {/* Total Badge */}
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-amber-300 shadow-xs">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500 block">
                    Total Confirmados Mañana
                  </span>
                  <div className="text-xs text-slate-600 font-bold">
                    {nextDayTotals.guestDesayuno > 0 ? (
                      <span>{nextDayTotals.resDesayuno} Residentes + {nextDayTotals.guestDesayuno} Invitados</span>
                    ) : (
                      <span>{nextDayTotals.resDesayuno} Residentes</span>
                    )}
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-xl">
                  {nextDayTotals.totalDesayuno}D
                </div>
              </div>
            </div>

            {/* Resident breakdown lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white/80 rounded-xl p-3.5 border border-amber-200 space-y-2">
                <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Desayunan Mañana ({residentsBreakfastNextDay.length} residentes):</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {residentsBreakfastNextDay.map((r) => (
                    <span
                      key={r.id}
                      className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg border border-amber-300 text-xs"
                    >
                      {r.name}
                    </span>
                  ))}
                  {residentsBreakfastNextDay.length === 0 && (
                    <span className="text-slate-400 italic">Ningún residente confirmado</span>
                  )}
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-3.5 border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <X className="w-4 h-4 text-slate-400" />
                  <span>No desayunan o ausentes ({residentsNoBreakfastNextDay.length} residentes):</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {residentsNoBreakfastNextDay.map((r) => {
                    const isAbsent = isDayInAbsence(nextDay, nextDayWeekOffset, absences, r.id);
                    return (
                      <span
                        key={r.id}
                        className={`px-2 py-0.5 rounded-lg font-semibold text-xs ${
                          isAbsent
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 line-through'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.name} {isAbsent ? '(Viaje)' : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* TABLA NOMINAL DE COCINA [Comida Hoy | Cena Hoy | Desayuno Mañana] */}
          {/* ================================================================= */}
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>📋 Flujo de Cocina y Pedidos ({getDayFullFormatted(selectedDay, weekOffset)})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Organizado por orden de servicio: Comida de Hoy, Cena de Hoy y Desayuno de Mañana
                </p>
              </div>

              <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                {residents.length} Residentes ({residents.length - dayTotals.resAbsentCount} presentes / {dayTotals.resAbsentCount} ausentes)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase font-bold text-[11px]">
                    <th className="p-3.5 rounded-l-xl">Residente</th>
                    <th className="p-3.5 text-center bg-emerald-950/60 border-x border-slate-800">
                      🍲 Comida Hoy ({getDayShortFormatted(selectedDay, weekOffset)})
                    </th>
                    <th className="p-3.5 text-center bg-indigo-950/60 border-r border-slate-800">
                      🌙 Cena Hoy ({getDayShortFormatted(selectedDay, weekOffset)})
                    </th>
                    <th className="p-3.5 text-center bg-amber-950/60 border-r border-slate-800">
                      ☕ Desayuno Mañana ({nextDayMeta?.short} {getDayDateOnly(nextDay, nextDayWeekOffset)})
                    </th>
                    <th className="p-3.5 rounded-r-xl">Observaciones / Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {residents.map((r) => {
                    const absenceToday = isDayInAbsence(selectedDay, weekOffset, absences, r.id);
                    const absenceTomorrow = isDayInAbsence(nextDay, nextDayWeekOffset, absences, r.id);
                    
                    const prefToday = allPreferences[r.id]?.[selectedDay];
                    const prefTomorrow = allPreferences[r.id]?.[nextDay];

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        
                        {/* Residente Initials */}
                        <td className="p-3 font-black text-slate-900 flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center text-xs font-black">
                            {r.name}
                          </span>
                          <span className="text-sm font-bold text-slate-800">{r.name}</span>
                        </td>

                        {/* 1. Comida Hoy */}
                        <td className="p-3 text-center bg-emerald-50/20">
                          {absenceToday ? (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200 inline-flex items-center gap-1">
                              <Plane className="w-3 h-3" />
                              <span>De Viaje</span>
                            </span>
                          ) : prefToday?.comida_tupper ? (
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-bold inline-flex items-center gap-1">
                              <Package className="w-3 h-3 text-indigo-700" />
                              <span>Tupper</span>
                            </span>
                          ) : prefToday?.comida_en_casa ? (
                            prefToday.comida_segundo_turno ? (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>2º Turno (14:45)</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold inline-flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>1er Turno (13:30)</span>
                              </span>
                            )
                          ) : (
                            <span className="text-slate-300 font-semibold">✕ No</span>
                          )}
                        </td>

                        {/* 2. Cena Hoy */}
                        <td className="p-3 text-center bg-indigo-50/20">
                          {absenceToday ? (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200 inline-flex items-center gap-1">
                              <Plane className="w-3 h-3" />
                              <span>De Viaje</span>
                            </span>
                          ) : prefToday?.cena_tupper ? (
                            <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 font-bold inline-flex items-center gap-1">
                              <Package className="w-3 h-3 text-purple-700" />
                              <span>Tupper</span>
                            </span>
                          ) : prefToday?.cena_en_casa ? (
                            prefToday.cena_segundo_turno ? (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>2º Turno (21:30)</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-bold inline-flex items-center gap-1">
                                <Check className="w-3 h-3 text-indigo-700" />
                                <span>1er Turno (20:30)</span>
                              </span>
                            )
                          ) : (
                            <span className="text-slate-300 font-semibold">✕ No</span>
                          )}
                        </td>

                        {/* 3. Desayuno Mañana */}
                        <td className="p-3 text-center bg-amber-50/20">
                          {absenceTomorrow ? (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200 inline-flex items-center gap-1">
                              <Plane className="w-3 h-3" />
                              <span>De Viaje</span>
                            </span>
                          ) : prefTomorrow?.desayuno_en_casa ? (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold inline-flex items-center gap-1">
                              <Coffee className="w-3 h-3 text-amber-800" />
                              <span>Comedor</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 font-semibold">✕ No</span>
                          )}
                        </td>

                        {/* Observaciones / Ausencias */}
                        <td className="p-3 text-slate-600">
                          {absenceToday ? (
                            <span className="bg-rose-50 text-rose-800 px-2.5 py-1 rounded-lg font-bold border border-rose-200 inline-flex items-center gap-1">
                              <Plane className="w-3 h-3 text-rose-600" />
                              <span>Ausente: {absenceToday.reason || 'Viaje'}</span>
                            </span>
                          ) : prefToday?.observaciones ? (
                            <span className="bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg font-medium border border-amber-200 inline-block">
                              {prefToday.observaciones}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>

                {/* ============================================================= */}
                {/* FILA DE TOTALES ACUMULADOS (Residentes + Invitados para Pedido)*/}
                {/* ============================================================= */}
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black border-t-2 border-amber-400">
                    
                    {/* Label Col */}
                    <td className="p-3.5 rounded-bl-xl space-y-0.5">
                      <div className="text-amber-400 text-xs uppercase tracking-wider font-extrabold">
                        TOTALES ACUMULADOS
                      </div>
                      <div className="text-[10px] text-slate-300 font-semibold">
                        (Residentes + Invitados)
                      </div>
                    </td>

                    {/* Total Comida Hoy */}
                    <td className="p-3.5 text-center bg-slate-850 border-x border-slate-750 space-y-1">
                      <div className="text-emerald-400 text-base font-black">
                        {dayTotals.totalComidaRaciones} Raciones Comida
                      </div>
                      <div className="text-[10px] text-emerald-200/90 font-medium">
                        {dayTotals.totalComida1} 1erT · {dayTotals.totalComida2} 2ºT · {dayTotals.totalComidaTupper} Tup
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ({dayTotals.resComidaTotal} Res + {dayTotals.guestComidaTotal} Inv)
                      </div>
                    </td>

                    {/* Total Cena Hoy */}
                    <td className="p-3.5 text-center bg-slate-850 border-r border-slate-750 space-y-1">
                      <div className="text-indigo-400 text-base font-black">
                        {dayTotals.totalCenaRaciones} Raciones Cena
                      </div>
                      <div className="text-[10px] text-indigo-200/90 font-medium">
                        {dayTotals.totalCena1} 1erT · {dayTotals.totalCena2} 2ºT · {dayTotals.totalCenaTupper} Tup
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ({dayTotals.resCenaTotal} Res + {dayTotals.guestCenaTotal} Inv)
                      </div>
                    </td>

                    {/* Total Desayuno Mañana */}
                    <td className="p-3.5 text-center bg-slate-850 border-r border-slate-750 space-y-1">
                      <div className="text-amber-400 text-base font-black">
                        {nextDayTotals.totalDesayuno} Desayunos
                      </div>
                      <div className="text-[10px] text-amber-200/90 font-medium">
                        (Mañana {nextDayMeta?.short})
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ({nextDayTotals.resDesayuno} Res + {nextDayTotals.guestDesayuno} Inv)
                      </div>
                    </td>

                    {/* Resumen / Código de Pedido */}
                    <td className="p-3.5 rounded-br-xl space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Código Cocina
                      </div>
                      <div className="text-sm font-black text-amber-300">
                        {dayTotals.totalComidaRaciones}C · {dayTotals.totalCenaRaciones}Cn · {nextDayTotals.totalDesayuno}D
                      </div>
                    </td>

                  </tr>
                </tfoot>

              </table>
            </div>
          </div>

          {/* Lista de Invitados para el día */}
          {dayTotals.dayGuests.length > 0 && (
            <div className="bg-indigo-50/70 rounded-2xl p-5 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-700" />
                  <span>Invitados Registrados para Hoy ({dayTotals.dayGuests.reduce((s, g) => s + g.count, 0)} raciones adicionales)</span>
                </h4>
                <button
                  onClick={() => onOpenAddGuestModal(selectedDay)}
                  className="text-xs font-extrabold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir otro</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {dayTotals.dayGuests.map((g) => {
                  const menuMeta = GUEST_MENU_LABELS[g.menuType] || GUEST_MENU_LABELS.estandar;
                  const serviceLabel = GUEST_SERVICE_LABELS[g.serviceMode] || 'Comedor';

                  return (
                    <div
                      key={g.id}
                      className="bg-white p-3 rounded-xl border border-indigo-200 shadow-2xs space-y-1.5 text-xs relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">
                          {g.count}x {g.guestName || 'Invitado'}
                        </span>
                        <span className="px-2 py-0.2 rounded-full font-black text-[10px] bg-indigo-100 text-indigo-900 uppercase">
                          {g.mealType}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span>Anfitrión: <strong>{g.hostName}</strong></span>
                        <span className="font-medium text-slate-500">{serviceLabel}</span>
                      </div>

                      {g.dietNotes && (
                        <div className="text-[10px] text-rose-700 bg-rose-50 p-1 rounded font-medium">
                          ⚠️ {g.dietNotes}
                        </div>
                      )}

                      <button
                        onClick={() => onDeleteGuest(g.id)}
                        className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-600 rounded transition opacity-0 group-hover:opacity-100"
                        title="Eliminar invitado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 2: SEMANA COMPLETA (CUADRÍCULA)                                 */}
      {/* ===================================================================== */}
      {kitchenMode === 'week' && (
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                📊 Matriz Semanal de Comidas ({getWeekRangeLabel(weekOffset)})
              </h3>
              <p className="text-xs text-slate-500">
                Residentes presentes e invitados computados automáticamente
              </p>
            </div>
            <button
              onClick={() => onOpenAbsenceModal()}
              className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300 inline-flex items-center gap-1 transition"
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Gestionar Ausencias ({absences.length})</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[11px]">
                  <th className="p-3 rounded-l-xl">Día</th>
                  <th className="p-3 text-center">☕ Desayuno</th>
                  <th className="p-3 text-center">🍲 Comida 1er Turno</th>
                  <th className="p-3 text-center">⏰ Comida 2º Turno</th>
                  <th className="p-3 text-center">🥡 Comida Tupper</th>
                  <th className="p-3 text-center">🌙 Cena 1er Turno</th>
                  <th className="p-3 text-center">⏰ Cena 2º Turno</th>
                  <th className="p-3 text-center">🥡 Cena Tupper</th>
                  <th className="p-3 rounded-r-xl text-center font-black">Total Raciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {DAYS.map((d) => {
                  const t = computeDayTotals(d.id);
                  const isCur = d.id === selectedDay;

                  return (
                    <tr
                      key={d.id}
                      onClick={() => {
                        onSelectDay(d.id);
                        setKitchenMode('day');
                      }}
                      className={`cursor-pointer transition ${
                        isCur ? 'bg-amber-50/80 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-3 font-extrabold text-slate-900">
                        <span>{getDayShortFormatted(d.id, weekOffset)}</span>
                        {t.resAbsentCount > 0 && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                            -{t.resAbsentCount} aus
                          </span>
                        )}
                        {t.dayGuests.length > 0 && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                            +{t.dayGuests.reduce((s, g) => s + g.count, 0)} inv
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-800">{t.totalDesayuno}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{t.totalComida1}</td>
                      <td className="p-3 text-center font-bold text-amber-600">{t.totalComida2}</td>
                      <td className="p-3 text-center font-bold text-indigo-600">{t.totalComidaTupper}</td>
                      <td className="p-3 text-center font-bold text-indigo-800">{t.totalCena1}</td>
                      <td className="p-3 text-center font-bold text-amber-600">{t.totalCena2}</td>
                      <td className="p-3 text-center font-bold text-purple-600">{t.totalCenaTupper}</td>
                      <td className="p-3 text-center font-black text-slate-900 text-sm">
                        <div>{t.granTotalDia}</div>
                        <div className="text-[10px] text-slate-500 font-bold">
                          {formatMealsSummary(t.totalDesayuno, t.totalComidaRaciones, t.totalCenaRaciones)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 3: PIZARRA DE COCINA (ALTO CONTRASTE)                           */}
      {/* ===================================================================== */}
      {kitchenMode === 'board' && (
        <div className="bg-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
                Pizarra Digital de Cocina • {getWeekRangeLabel(weekOffset)}
              </span>
              <h3 className="text-3xl font-black text-white mt-1 capitalize">
                {getDayFullFormatted(selectedDay, weekOffset)}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-amber-500 text-slate-950 rounded-2xl text-base font-black">
                {formatMealsSummary(dayTotals.totalDesayuno, dayTotals.totalComidaRaciones, dayTotals.totalCenaRaciones)}
              </span>
              <button
                onClick={() => setKitchenMode('day')}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 transition"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Comida Hoy */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-extrabold text-emerald-400 text-base">🍲 COMIDA HOY</span>
                <span className="text-2xl font-black text-white">{dayTotals.totalComidaRaciones}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>1er Turno (13:30):</span>
                  <strong className="text-white text-base">{dayTotals.totalComida1}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>2º Turno (14:45):</span>
                  <strong className="text-amber-400 text-base">{dayTotals.totalComida2}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tuppers:</span>
                  <strong className="text-indigo-400 text-base">{dayTotals.totalComidaTupper}</strong>
                </div>
              </div>
            </div>

            {/* Cena Hoy */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-extrabold text-indigo-400 text-base">🌙 CENA HOY</span>
                <span className="text-2xl font-black text-white">{dayTotals.totalCenaRaciones}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>1er Turno (20:30):</span>
                  <strong className="text-white text-base">{dayTotals.totalCena1}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>2º Turno (21:30):</span>
                  <strong className="text-amber-400 text-base">{dayTotals.totalCena2}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tuppers:</span>
                  <strong className="text-purple-400 text-base">{dayTotals.totalCenaTupper}</strong>
                </div>
              </div>
            </div>

            {/* Desayuno Mañana */}
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-extrabold text-amber-400 text-base">☕ DESAYUNO MAÑANA</span>
                <span className="text-2xl font-black text-amber-300">{nextDayTotals.totalDesayuno}</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <span className="block text-slate-400 font-bold">Comedor confirmados:</span>
                <div className="flex flex-wrap gap-1 pt-1">
                  {residentsBreakfastNextDay.map((r) => (
                    <span key={r.id} className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded font-bold">
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
