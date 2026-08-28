import React, { useState } from 'react';
import { Users, Plus, Trash2, Calendar, Utensils, Clock, Package, Sparkles, Filter } from 'lucide-react';
import { DAYS, GUEST_MENU_LABELS, GUEST_SERVICE_LABELS } from '../constants';
import { DayOfWeek, GuestEntry, GuestMealType, Resident } from '../types';
import { getDayShortFormatted, getDayFullFormatted, getDayDateOnly, getWeekRangeLabel, isDayToday } from '../utils/dateUtils';
import { WeekNavigator } from './WeekNavigator';

interface GuestsViewProps {
  guests: GuestEntry[];
  residents: Resident[];
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  weekOffset?: number;
  onSetWeekOffset?: (offset: number) => void;
  onPreviousWeek?: () => void;
  onNextWeek?: () => void;
  onCurrentWeek?: () => void;
  onOpenAddModal: (day?: DayOfWeek, mealType?: GuestMealType, hostName?: string) => void;
  onDeleteGuest: (id: string) => void;
}

export const GuestsView: React.FC<GuestsViewProps> = ({
  guests,
  residents,
  selectedDay,
  onSelectDay,
  weekOffset = 0,
  onSetWeekOffset,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onOpenAddModal,
  onDeleteGuest,
}) => {
  const [filterDay, setFilterDay] = useState<DayOfWeek | 'all'>(selectedDay);

  const filteredGuests = guests.filter((g) => {
    if (filterDay === 'all') return true;
    return g.day === filterDay;
  });

  const totalGuestsWeek = guests.reduce((sum, g) => sum + g.count, 0);

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

      {/* Week Navigator */}
      {onSetWeekOffset && onPreviousWeek && onNextWeek && onCurrentWeek && (
        <WeekNavigator
          weekOffset={weekOffset}
          onSetWeekOffset={onSetWeekOffset}
          onPreviousWeek={onPreviousWeek}
          onNextWeek={onNextWeek}
          onCurrentWeek={onCurrentWeek}
        />
      )}

      {/* Selector de Día */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Filtrar por día de la semana ({getWeekRangeLabel(weekOffset)}):
          </span>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            Total registrados: {totalGuestsWeek} {totalGuestsWeek === 1 ? 'comensal' : 'comensales'}
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
            const isToday = isDayToday(d.id, weekOffset);
            const countForDay = guests.filter((g) => g.day === d.id).reduce((sum, g) => sum + g.count, 0);
            const dateOnly = getDayDateOnly(d.id, weekOffset);

            return (
              <button
                key={d.id}
                onClick={() => {
                  setFilterDay(d.id);
                  onSelectDay(d.id);
                }}
                className={`py-2 px-1.5 rounded-xl text-center transition border font-bold text-xs flex flex-col items-center justify-center gap-0.5 relative ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-indigo-500/50'
                    : isToday
                    ? 'bg-indigo-50/60 text-slate-800 border-indigo-300 ring-1 ring-indigo-400/40'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                {isToday && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-indigo-600 text-white text-[9px] font-black rounded-full shadow-2xs tracking-wide">
                    HOY
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <span>{d.short}</span>
                  <span className={`text-[10px] font-semibold ${isSelected ? 'text-indigo-300' : isToday ? 'text-indigo-700' : 'text-slate-500'}`}>
                    {dateOnly}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px]">{d.label}</span>
                  {countForDay > 0 ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500 text-white font-black">
                      +{countForDay}
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-normal">0</span>
                  )}
                </div>
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
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold">No hay invitados registrados para este filtro</p>
            <p className="text-xs text-slate-400">
              Pulsa en "+ Registrar Invitado" para avisar a la cocina de una ración adicional.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGuests.map((g) => {
              const menu = GUEST_MENU_LABELS[g.menuType] || GUEST_MENU_LABELS.estandar;
              const service = GUEST_SERVICE_LABELS[g.serviceMode] || 'Comedor';
              const dayMeta = DAYS.find((d) => d.id === g.day);

              return (
                <div
                  key={g.id}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between space-y-3 hover:shadow-sm transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md">
                        {dayMeta?.label} ({getDayDateOnly(g.day, weekOffset)}) • {g.mealType}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                        {g.count} {g.count === 1 ? 'persona' : 'personas'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {g.guestName || 'Invitado(s)'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Anfitrión: <strong className="text-slate-800">{g.hostName}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px] pt-1">
                      <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {service}
                      </span>
                      <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        Menú: <strong>{menu.label}</strong>
                      </span>
                    </div>

                    {g.dietNotes && (
                      <div className="text-xs bg-rose-50 text-rose-700 p-2 rounded-xl border border-rose-100 font-medium">
                        ⚠️ <strong className="font-bold">Alergias/Dieta:</strong> {g.dietNotes}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      ID: {g.id.substring(0, 10)}
                    </span>
                    <button
                      onClick={() => onDeleteGuest(g.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1 rounded hover:bg-rose-50 flex items-center gap-1 transition"
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
