import React from 'react';
import { Utensils, User, Users, Settings, CheckCircle2, AlertCircle, PhoneCall, ClipboardList, Building2 } from 'lucide-react';
import { DayOfWeek, Residencia, SupabaseConfig } from '../types';
import { getDayFullFormatted } from '../utils/dateUtils';
import { RESIDENCIA_BADGES } from '../constants';

interface HeaderProps {
  currentTab: 'resident' | 'kitchen' | 'guests' | 'admin_agenda';
  setCurrentTab: (tab: 'resident' | 'kitchen' | 'guests' | 'admin_agenda') => void;
  activeResidencia: Residencia;
  onSelectResidencia: (residencia: Residencia) => void;
  supabaseConfig: SupabaseConfig;
  onOpenSettings: () => void;
  syncSource: 'supabase' | 'local';
  isSaving: boolean;
  guestCountTotal: number;
  pendingAdminNotesCount?: number;
  confirmedResidentsCount: number;
  totalResidentsCount: number;
  selectedDay: DayOfWeek;
  weekOffset?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  activeResidencia,
  onSelectResidencia,
  supabaseConfig,
  onOpenSettings,
  syncSource,
  isSaving,
  guestCountTotal,
  pendingAdminNotesCount = 0,
  confirmedResidentsCount,
  totalResidentsCount,
  selectedDay,
  weekOffset = 0,
}) => {
  const formattedDay = getDayFullFormatted(selectedDay, weekOffset);
  const activeBadge = RESIDENCIA_BADGES[activeResidencia];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Bar with Residence Switcher and App Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80">
        
        {/* Brand and Active Residence Tag */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md font-bold text-lg">
              🍽️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">Comidas Residencias</h1>
                
                {/* Residence Badge */}
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide ${activeBadge.tagColor}`}>
                  {activeBadge.name}
                </span>

                <span 
                  className="bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold px-2 py-0.5 rounded-full hidden sm:inline-block"
                  title={`${confirmedResidentsCount} de ${totalResidentsCount} residentes físicos confirmados en comedor para ${formattedDay}`}
                >
                  {confirmedResidentsCount}/{totalResidentsCount} confirmados
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-emerald-400">{formattedDay}</span>
                <span>•</span>
                <span>Separación completa de datos Ucanca / Taiba</span>
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

        {/* RESIDENCE SELECTOR: Ucanca (10) vs Taiba (11) */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-700 self-start md:self-auto">
          <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Residencia:</span>
          </span>

          <button
            onClick={() => onSelectResidencia('ucanca')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              activeResidencia === 'ucanca'
                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <span>🌿 Ucanca</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeResidencia === 'ucanca' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-800 text-slate-400'}`}>
              {RESIDENCIA_BADGES.ucanca.capacity}
            </span>
          </button>

          <button
            onClick={() => onSelectResidencia('taiba')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              activeResidencia === 'taiba'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <span>🌊 Taiba</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeResidencia === 'taiba' ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'}`}>
              {RESIDENCIA_BADGES.taiba.capacity}
            </span>
          </button>
        </div>

      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
        
        {/* Tab Navigation */}
        <div className="flex items-center overflow-x-auto bg-slate-950/70 p-1 rounded-xl border border-slate-800 scrollbar-none gap-1">
          <button
            onClick={() => setCurrentTab('resident')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
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
            className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
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
            className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
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
            className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
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
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-950/90 text-amber-300 border border-amber-800 hover:bg-amber-900/80 transition"
              title="Guardando en almacenamiento local del navegador"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Modo Local</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Configurar Supabase / Ajustes"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};

