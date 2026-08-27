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
  AlertCircle
} from 'lucide-react';
import { DAYS, GUEST_MENU_LABELS, GUEST_SERVICE_LABELS } from '../constants';
import { DayOfWeek, GuestEntry, GuestMealType, Resident, ResidentWeeklySchedule } from '../types';

interface KitchenViewProps {
  residents: Resident[];
  allPreferences: Record<number, ResidentWeeklySchedule>;
  guests: GuestEntry[];
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  onOpenAddGuestModal: (day: DayOfWeek, mealType?: GuestMealType) => void;
  onDeleteGuest: (id: string) => void;
  syncSource: 'supabase' | 'local';
}

export const KitchenView: React.FC<KitchenViewProps> = ({
  residents,
  allPreferences,
  guests,
  selectedDay,
  onSelectDay,
  onOpenAddGuestModal,
  onDeleteGuest,
  syncSource,
}) => {
  const [kitchenMode, setKitchenMode] = useState<'day' | 'week' | 'board'>('day');

  // Compute daily totals including guests
  const computeDayTotals = (day: DayOfWeek) => {
    // 1. Resident counts
    let resDesayuno = 0;
    let resComida1 = 0;
    let resComida2 = 0;
    let resComidaTupper = 0;
    let resCena1 = 0;
    let resCena2 = 0;
    let resCenaTupper = 0;

    residents.forEach((r) => {
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
              Panel de Cocina y Comedor
            </span>
            <span className="text-xs text-slate-500 font-medium">
              10 Residentes + Comensales Invitados
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Recuento Total de Raciones, Turnos y Tuppers
          </h2>
        </div>

        {/* Modos de vista y acciones */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setKitchenMode('day')}
              className={`px-3 py-1.5 rounded-lg transition ${
                kitchenMode === 'day' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Día a Día
            </button>
            <button
              onClick={() => setKitchenMode('week')}
              className={`px-3 py-1.5 rounded-lg transition ${
                kitchenMode === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana Completa
            </button>
            <button
              onClick={() => setKitchenMode('board')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                kitchenMode === 'board' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              <span>Pizarra</span>
            </button>
          </div>

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

      {/* Selector de Días */}
      {kitchenMode !== 'week' && (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {DAYS.map((day) => {
            const isSelected = day.id === selectedDay;
            const totals = computeDayTotals(day.id);

            return (
              <button
                key={day.id}
                onClick={() => onSelectDay(day.id)}
                className={`p-3 rounded-xl text-center transition-all border flex flex-col items-center justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-500/50'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-semibold">{day.short}</span>
                  {totals.dayGuests.length > 0 && (
                    <span className="text-[9px] px-1 bg-indigo-500 text-white rounded font-bold">
                      +{totals.dayGuests.reduce((s, g) => s + g.count, 0)} inv
                    </span>
                  )}
                </div>

                <span className={`text-base font-extrabold block ${isSelected ? 'text-amber-400' : 'text-slate-900'}`}>
                  {day.label}
                </span>

                <div className="w-full pt-1 border-t border-slate-100/20 text-[10px] font-semibold flex justify-around">
                  <span title="Comidas">{totals.totalComidaRaciones} C</span>
                  <span title="Cenas">{totals.totalCenaRaciones} Cn</span>
                  {totals.totalComidaTupper + totals.totalCenaTupper > 0 && (
                    <span className="text-indigo-400 font-bold" title="Tuppers">{totals.totalComidaTupper + totals.totalCenaTupper}T</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 1: DÍA A DÍA                                                    */}
      {/* ===================================================================== */}
      {kitchenMode === 'day' && (
        <div className="space-y-6">
          
          {/* Banner Resumen Ejecutivo */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-md border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block">
                Plan de Cocina para Hoy
              </span>
              <h3 className="text-2xl font-black text-white capitalize">
                {currentDayMeta?.label}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Gran Total: <strong className="text-emerald-400 text-sm">{dayTotals.granTotalDia} raciones</strong> para el día ({dayTotals.totalDesayuno} desayunos, {dayTotals.totalComidaRaciones} comidas, {dayTotals.totalCenaRaciones} cenas).
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

              {dayTotals.dayGuests.length > 0 && (
                <div className="bg-indigo-950 px-3.5 py-2 rounded-xl border border-indigo-700 text-center">
                  <span className="text-indigo-300 block text-[10px] uppercase font-bold">Invitados Hoy</span>
                  <span className="text-lg font-black text-indigo-200">
                    {dayTotals.dayGuests.reduce((s, g) => s + g.count, 0)}
                  </span>
                  <span className="text-[10px] text-indigo-300 block">
                    comensales
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3 Tarjetas de Resumen por Comida */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 1. DESAYUNO */}
            <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                      <Coffee className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">Desayuno</h4>
                      <span className="text-xs text-slate-500">07:30 - 09:30</span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-amber-900">
                    {dayTotals.totalDesayuno}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-100">
                    <span className="font-semibold text-slate-700">Residentes en comedor:</span>
                    <span className="font-bold text-slate-900">{dayTotals.resDesayuno} / 10</span>
                  </div>

                  {dayTotals.guestDesayuno > 0 && (
                    <div className="flex items-center justify-between bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 text-indigo-900">
                      <span className="font-semibold">Invitados extra:</span>
                      <span className="font-black">+{dayTotals.guestDesayuno}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/60 text-xs text-amber-900 font-medium">
                ☕ Raciones totales a preparar: <strong>{dayTotals.totalDesayuno}</strong>
              </div>
            </div>

            {/* 2. COMIDA */}
            <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                      <UtensilsCrossed className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">Comida</h4>
                      <span className="text-xs text-slate-500">13:30 - 15:30</span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-emerald-900">
                    {dayTotals.totalComidaRaciones}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="font-semibold text-slate-700">1er Turno (13:30):</span>
                    <span className="font-bold text-emerald-800 text-sm">
                      {dayTotals.totalComida1} platos
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="font-semibold text-slate-700">2º Turno (14:45):</span>
                    <span className="font-bold text-amber-700 text-sm">
                      {dayTotals.totalComida2} platos
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="font-semibold text-slate-700">Para llevar (Tupper):</span>
                    <span className="font-bold text-indigo-700 text-sm">
                      {dayTotals.totalComidaTupper} tuppers
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 text-xs text-emerald-900 font-medium">
                🍲 Total comida: <strong>{dayTotals.totalComidaRaciones}</strong> ({dayTotals.resComidaTotal} residentes + {dayTotals.guestComidaTotal} invitados)
              </div>
            </div>

            {/* 3. CENA */}
            <div className="bg-indigo-50/70 rounded-2xl p-5 border border-indigo-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
                      <Moon className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">Cena</h4>
                      <span className="text-xs text-slate-500">20:30 - 22:00</span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-indigo-900">
                    {dayTotals.totalCenaRaciones}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="font-semibold text-slate-700">1er Turno (20:30):</span>
                    <span className="font-bold text-indigo-800 text-sm">
                      {dayTotals.totalCena1} platos
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="font-semibold text-slate-700">2º Turno (21:30):</span>
                    <span className="font-bold text-amber-700 text-sm">
                      {dayTotals.totalCena2} platos
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="font-semibold text-slate-700">Para llevar (Tupper):</span>
                    <span className="font-bold text-purple-700 text-sm">
                      {dayTotals.totalCenaTupper} tuppers
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-indigo-200/60 text-xs text-indigo-900 font-medium">
                🌙 Total cena: <strong>{dayTotals.totalCenaRaciones}</strong> ({dayTotals.resCenaTotal} residentes + {dayTotals.guestCenaTotal} invitados)
              </div>
            </div>

          </div>

          {/* Sección de Invitados del Día */}
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Comensales Invitados para {currentDayMeta?.label} ({dayTotals.dayGuests.reduce((s, g) => s + g.count, 0)})
                </h3>
              </div>

              <button
                onClick={() => onOpenAddGuestModal(selectedDay)}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Registrar Invitado</span>
              </button>
            </div>

            {dayTotals.dayGuests.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 italic">
                No hay comensales invitados registrados para este día.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dayTotals.dayGuests.map((g) => {
                  const menuInfo = GUEST_MENU_LABELS[g.menuType] || GUEST_MENU_LABELS.estandar;
                  return (
                    <div
                      key={g.id}
                      className="bg-indigo-50/40 rounded-xl p-3.5 border border-indigo-200 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 capitalize">
                            {g.mealType === 'desayuno' ? '☕ Desayuno' : g.mealType === 'comida' ? '🍲 Comida' : '🌙 Cena'}
                          </span>
                          <span className="px-2 py-0.2 rounded-full bg-indigo-600 text-white font-black text-[11px]">
                            {g.count} {g.count === 1 ? 'persona' : 'personas'}
                          </span>
                        </div>
                        
                        <div className="text-slate-600">
                          <span className="font-semibold">Modalidad:</span> {GUEST_SERVICE_LABELS[g.serviceMode]}
                        </div>

                        <div className="text-slate-600">
                          <span className="font-semibold">Anfitrión:</span> <strong className="text-slate-800">{g.hostName}</strong>
                        </div>

                        <div>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${menuInfo.color}`}>
                            {menuInfo.label}
                          </span>
                        </div>

                        {g.notes && <div className="text-[11px] text-slate-500 italic pt-0.5">"{g.notes}"</div>}
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

          {/* Tabla Nominal de Residentes (Iniciales) */}
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center justify-between">
              <span>📋 Lista Nominal de los 10 Residentes ({currentDayMeta?.label})</span>
              <span className="text-xs font-normal text-slate-500">Orden oficial de residencia</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px]">
                    <th className="p-3 rounded-l-xl">Residente</th>
                    <th className="p-3 text-center">☕ Desayuno</th>
                    <th className="p-3 text-center">🍲 Comida</th>
                    <th className="p-3 text-center">🌙 Cena</th>
                    <th className="p-3 rounded-r-xl">Observaciones de Cocina</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {residents.map((r) => {
                    const pref = allPreferences[r.id]?.[selectedDay];

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-black text-slate-900 flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center text-xs font-black">
                            {r.name}
                          </span>
                          <span className="text-sm font-bold text-slate-800">{r.name}</span>
                        </td>

                        {/* Desayuno */}
                        <td className="p-3 text-center">
                          {pref?.desayuno_en_casa ? (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold inline-flex items-center gap-1">
                              <Check className="w-3 h-3 text-amber-800" />
                              <span>Comedor</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 font-semibold">✕ No</span>
                          )}
                        </td>

                        {/* Comida */}
                        <td className="p-3 text-center">
                          {pref?.comida_tupper ? (
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-bold inline-flex items-center gap-1">
                              <Package className="w-3 h-3 text-indigo-700" />
                              <span>Tupper</span>
                            </span>
                          ) : pref?.comida_en_casa ? (
                            pref.comida_segundo_turno ? (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>2º Turno (14:45)</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold inline-flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>1er Turno</span>
                              </span>
                            )
                          ) : (
                            <span className="text-slate-300 font-semibold">✕ No</span>
                          )}
                        </td>

                        {/* Cena */}
                        <td className="p-3 text-center">
                          {pref?.cena_tupper ? (
                            <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 font-bold inline-flex items-center gap-1">
                              <Package className="w-3 h-3 text-purple-700" />
                              <span>Tupper</span>
                            </span>
                          ) : pref?.cena_en_casa ? (
                            pref.cena_segundo_turno ? (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>2º Turno (21:30)</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-bold inline-flex items-center gap-1">
                                <Check className="w-3 h-3 text-indigo-700" />
                                <span>1er Turno</span>
                              </span>
                            )
                          ) : (
                            <span className="text-slate-300 font-semibold">✕ No</span>
                          )}
                        </td>

                        {/* Observaciones */}
                        <td className="p-3 text-slate-600">
                          {pref?.observaciones ? (
                            <span className="bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg font-medium border border-amber-200 inline-block">
                              {pref.observaciones}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
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
      )}

      {/* ===================================================================== */}
      {/* VISTA 2: SEMANA COMPLETA (CUADRÍCULA)                                 */}
      {/* ===================================================================== */}
      {kitchenMode === 'week' && (
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900">
              📊 Matriz Semanal de Comidas (Lunes a Domingo)
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Residentes e Invitados
            </span>
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
                        <span>{d.label}</span>
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
                        {t.granTotalDia}
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
      {/* VISTA 3: MODO PIZARRA / PANTALLA COMPLETA                            */}
      {/* ===================================================================== */}
      {kitchenMode === 'board' && (
        <div className="bg-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-amber-400 text-xs font-black uppercase tracking-widest">
                Modo Pizarra de Cocina
              </span>
              <h2 className="text-3xl font-black text-white capitalize">
                {currentDayMeta?.label}
              </h2>
            </div>
            <button
              onClick={() => setKitchenMode('day')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-200 transition"
            >
              Salir de Pizarra
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Desayuno */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-amber-500/30 space-y-3">
              <span className="text-amber-400 text-sm font-bold uppercase block">☕ Desayunos</span>
              <div className="text-5xl font-black text-white">{dayTotals.totalDesayuno}</div>
              <p className="text-xs text-slate-400">
                {dayTotals.resDesayuno} residentes {dayTotals.guestDesayuno > 0 ? `+ ${dayTotals.guestDesayuno} invitados` : ''}
              </p>
            </div>

            {/* Comida */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-emerald-500/30 space-y-3">
              <span className="text-emerald-400 text-sm font-bold uppercase block">🍲 Comidas Total</span>
              <div className="text-5xl font-black text-white">{dayTotals.totalComidaRaciones}</div>
              <div className="text-xs text-slate-300 space-y-1">
                <div>1er Turno (13:30): <strong className="text-emerald-300 font-black">{dayTotals.totalComida1}</strong></div>
                <div>2º Turno (14:45): <strong className="text-amber-300 font-black">{dayTotals.totalComida2}</strong></div>
                <div>Tuppers: <strong className="text-indigo-300 font-black">{dayTotals.totalComidaTupper}</strong></div>
              </div>
            </div>

            {/* Cena */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-indigo-500/30 space-y-3">
              <span className="text-indigo-400 text-sm font-bold uppercase block">🌙 Cenas Total</span>
              <div className="text-5xl font-black text-white">{dayTotals.totalCenaRaciones}</div>
              <div className="text-xs text-slate-300 space-y-1">
                <div>1er Turno (20:30): <strong className="text-indigo-300 font-black">{dayTotals.totalCena1}</strong></div>
                <div>2º Turno (21:30): <strong className="text-amber-300 font-black">{dayTotals.totalCena2}</strong></div>
                <div>Tuppers: <strong className="text-purple-300 font-black">{dayTotals.totalCenaTupper}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
