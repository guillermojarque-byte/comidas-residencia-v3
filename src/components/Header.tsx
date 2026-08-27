import React from 'react';
import { Utensils, User, Users, Settings, CheckCircle2, AlertCircle, PhoneCall, ClipboardList } from 'lucide-react';
import { DayOfWeek, SupabaseConfig } from '../types';
import { getDayFullFormatted } from '../utils/dateUtils';

interface HeaderProps {
  currentTab: 'resident' | 'kitchen' | 'guests' | 'admin_agenda';
  setCurrentTab: (tab: 'resident' | 'kitchen' | 'guests' | 'admin_agenda') => void;
  supabaseConfig: SupabaseConfig;
  onOpenSettings: () => void;
  syncSource: 'supabase' | 'local';
  isSaving: boolean;
  guestCountTotal: number;
  pendingAdminNotesCount?: number;
  confirmedResidentsCount: number;
  totalResidentsCount: number;
  selectedDay: DayOfWeek;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  supabaseConfig,
  onOpenSettings,
  syncSource,
  isSaving,
  guestCountTotal,
  pendingAdminNotesCount = 0,
  confirmedResidentsCount,
  totalResidentsCount,
  selectedDay,
}) => {
  const formattedDay = getDayFullFormatted(selectedDay);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md font-bold text-xl">
              🍽️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">Comidas Residencia</h1>
                <span 
                  className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black px-2.5 py-0.5 rounded-full"
                  title={`${confirmedResidentsCount} de ${totalResidentsCount} residentes físicos confirmados en comedor para ${formattedDay}`}
                >
                  {confirmedResidentsCount}/{totalResidentsCount} residentes
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-emerald-400">{formattedDay}</span>
                <span>•</span>
                <span>Planificador de comidas y agenda</span>
              </p>
            </div>
          </div>

          {/* Mobile settings trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Ajustes de conexión"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation: Purely Practical */}
        <div className="flex items-center overflow-x-auto bg-slate-950/70 p-1 rounded-xl border border-slate-800 scrollbar-none gap-1">
          <button
            onClick={() => setCurrentTab('resident')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              currentTab === 'resident'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <User className="w-4 h-4 text-emerald-300" />
            <span>Soy Residente</span>
          </button>

          <button
            onClick={() => setCurrentTab('kitchen')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              currentTab === 'kitchen'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-300" />
            <span>Cocina y Comedor</span>
          </button>

          <button
            onClick={() => setCurrentTab('guests')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              currentTab === 'guests'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-300" />
            <span>Invitados</span>
            {guestCountTotal > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {guestCountTotal}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('admin_agenda')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              currentTab === 'admin_agenda'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-blue-300" />
            <span>Agenda Administración</span>
            {pendingAdminNotesCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingAdminNotesCount}
              </span>
            )}
          </button>
        </div>

        {/* Database connection badge & settings */}
        <div className="hidden md:flex items-center gap-3">
          {isSaving ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>Guardando...</span>
            </div>
          ) : syncSource === 'supabase' && supabaseConfig.isConfigured ? (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/90 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/80 transition"
              title="Conectado a Supabase"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sincronizado</span>
            </button>
          ) : (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
              title="Modo Local"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Local</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition"
            title="Ajustes de conexión"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
