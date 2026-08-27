import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from 'lucide-react';
import { getWeekRangeLabel, getMondayForWeekOffset, formatDateToISO } from '../utils/dateUtils';

interface WeekNavigatorProps {
  weekOffset: number;
  onSetWeekOffset: (offset: number) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  className?: string;
  compact?: boolean;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  weekOffset,
  onSetWeekOffset,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  className = '',
  compact = false,
}) => {
  const weekLabel = getWeekRangeLabel(weekOffset);
  const isCurrent = weekOffset === 0;

  const handleDatePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const picked = new Date(e.target.value);
    const todayMonday = getMondayForWeekOffset(0);
    const pickedMonday = new Date(picked);
    const day = pickedMonday.getDay();
    const diff = pickedMonday.getDate() - day + (day === 0 ? -6 : 1);
    pickedMonday.setDate(diff);
    pickedMonday.setHours(0, 0, 0, 0);

    const msDiff = pickedMonday.getTime() - todayMonday.getTime();
    const offset = Math.round(msDiff / (7 * 86400000));
    onSetWeekOffset(offset);
  };

  const mondayISO = formatDateToISO(getMondayForWeekOffset(weekOffset));

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-xs px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2.5 ${className}`}
    >
      {/* Week status & navigation buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onPreviousWeek}
          className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition"
          title="Semana anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Semana anterior</span>
        </button>

        <button
          onClick={onNextWeek}
          className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition"
          title="Semana siguiente"
        >
          <span className="hidden sm:inline">Semana siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {!isCurrent && (
          <button
            onClick={onCurrentWeek}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold rounded-xl text-xs flex items-center gap-1 transition"
            title="Volver a la semana actual"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Esta Semana</span>
          </button>
        )}
      </div>

      {/* Week Label & Date selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
            {weekLabel}
          </span>
        </div>

        {/* Current week badge */}
        {isCurrent ? (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
            Semana Actual
          </span>
        ) : weekOffset > 0 ? (
          <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
            +{weekOffset} {weekOffset === 1 ? 'semana' : 'semanas'}
          </span>
        ) : (
          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
            {weekOffset} {weekOffset === -1 ? 'semana' : 'semanas'}
          </span>
        )}

        {/* Hidden Date Picker input for direct selection */}
        <label className="cursor-pointer p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition relative" title="Elegir fecha">
          <input
            type="date"
            value={mondayISO}
            onChange={handleDatePicked}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <Calendar className="w-3.5 h-3.5" />
        </label>
      </div>
    </div>
  );
};
