import React, { useState } from 'react';
import { Users, Plus, Trash2, Calendar, Utensils, Clock, Package, Sparkles, Filter } from 'lucide-react';
import { DAYS, GUEST_MENU_LABELS, GUEST_SERVICE_LABELS } from '../constants';
import { DayOfWeek, GuestEntry, GuestMealType, Resident } from '../types';

interface GuestsViewProps {
  guests: GuestEntry[];
  residents: Resident[];
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  onOpenAddModal: (day?: DayOfWeek, mealType?: GuestMealType, hostName?: string) => void;
  onDeleteGuest: (id: string) => void;
}

export const GuestsView: React.FC<GuestsViewProps> = ({
  guests,
  residents,
  selectedDay,
  onSelectDay,
  onOpenAddModal,
  onDeleteGuest,
}) => {
  const [filterDay, setFilterDay] = useState<DayOfWeek | 'all'>(selectedDay);

  const filteredGuests = guests.filter((g) => {
    if (filterDay === 'all') return true;
    return g.day === filterDay;
  });

  const totalGuestsWeek = guests.reduce((sum, g) => sum + g.count, 0);
  const totalGuestsSelectedDay = guests
    .filter((g) => g.day === selectedDay)
    .reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 font-bold rounded-lg text-xs flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Gestión de Invitados
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Comensales no habituales de la residencia
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Registro de Comensales Extra para Cocina
          </h2>
        </div>

        <button
          onClick={() => onOpenAddModal(selectedDay)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registrar Invitado</span>
        </button>
      </div>

      {/* Selector de Día */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Filtrar por día de la semana:
          </span>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            Total semana: {totalGuestsWeek} {totalGuestsWeek === 1 ? 'comensal' : 'comensales'}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          <button
            onClick={() => setFilterDay('all')}
            className={`py-2.5 px-2 rounded-xl text-center transition border font-bold text-xs flex flex-col items-center justify-center gap-0.5 ${
              filterDay === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-indigo-500/50'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <span>Toda</span>
            <span className="text-[10px] opacity-80">Semana</span>
          </button>

          {DAYS.map((d) => {
            const isSelected = filterDay === d.id;
            const countForDay = guests.filter((g) => g.day === d.id).reduce((sum, g) => sum + g.count, 0);

            return (
              <button
                key={d.id}
                onClick={() => {
                  setFilterDay(d.id);
                  onSelectDay(d.id);
                }}
                className={`py-2.5 px-2 rounded-xl text-center transition border font-bold text-xs flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-indigo-500/50'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <span>{d.label}</span>
                {countForDay > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500 text-white font-black">
                    +{countForDay}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">0</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Invitados */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>Comensales Registrados</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {filteredGuests.length} {filteredGuests.length === 1 ? 'registro' : 'registros'}
            </span>
          </h3>

          <button
            onClick={() => onOpenAddModal(filterDay === 'all' ? selectedDay : filterDay)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir para este día</span>
          </button>
        </div>

        {filteredGuests.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No hay invitados registrados para este período</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Si viene algún familiar, amigo o comensal externo, puedes registrarlo aquí para que cocina prepare su ración.
            </p>
            <button
              onClick={() => onOpenAddModal(filterDay === 'all' ? selectedDay : filterDay)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Invitado Ahora</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGuests.map((g) => {
              const dayMeta = DAYS.find((d) => d.id === g.day);
              const menuInfo = GUEST_MENU_LABELS[g.menuType] || GUEST_MENU_LABELS.estandar;

              return (
                <div
                  key={g.id}
                  className="bg-slate-50 hover:bg-slate-100/80 rounded-xl p-4 border border-slate-200 transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-black capitalize">
                        {dayMeta?.label}
                      </span>
                      <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        {g.count} {g.count === 1 ? 'comensal' : 'comensales'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900 capitalize">
                        {g.mealType === 'desayuno' ? '☕ Desayuno' : g.mealType === 'comida' ? '🍲 Comida' : '🌙 Cena'}
                      </span>
                      {g.mealType !== 'desayuno' && (
                        <span className="text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                          {GUEST_SERVICE_LABELS[g.serviceMode] || g.serviceMode}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        <span className="font-semibold text-slate-700">Anfitrión:</span>{' '}
                        <span className="font-bold text-slate-900 bg-slate-200/70 px-1.5 py-0.5 rounded">
                          {g.hostName}
                        </span>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-700">Menú:</span>{' '}
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] border ${menuInfo.color}`}>
                          {menuInfo.label}
                        </span>
                      </div>

                      {g.notes && (
                        <div className="pt-1 text-slate-500 italic">
                          "{g.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-end">
                    <button
                      onClick={() => onDeleteGuest(g.id)}
                      className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 text-xs font-bold flex items-center gap-1 transition"
                      title="Eliminar invitado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
