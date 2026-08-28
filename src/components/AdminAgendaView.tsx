import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Home, 
  Utensils, 
  Wrench, 
  FileText, 
  Search, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Printer, 
  Calendar,
  Sparkles,
  User,
  ChevronRight,
  Filter,
  CheckCheck
} from 'lucide-react';
import { DAYS } from '../constants';
import { AdminNote, AdminNoteCategory, AdminNoteStatus, DayOfWeek, Resident } from '../types';
import { 
  getDayShortFormatted, 
  getDayFullFormatted, 
  getDayDateOnly, 
  getDayISOString, 
  getWeekRangeLabel, 
  formatDateDDMMYY, 
  parseISODate,
  formatDateToISO,
  isDayToday
} from '../utils/dateUtils';
import { WeekNavigator } from './WeekNavigator';

interface AdminAgendaViewProps {
  notes: AdminNote[];
  residents: Resident[];
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  weekOffset: number;
  onSetWeekOffset: (offset: number) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onOpenAddModal: (author?: string, targetDate?: string) => void;
  onEditNote: (note: AdminNote) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleStatus: (note: AdminNote, nextStatus: AdminNoteStatus) => void;
  syncSource: 'supabase' | 'local';
}

const CATEGORY_CONFIG: Record<AdminNoteCategory, { label: string; icon: React.FC<{ className?: string }>; badgeClass: string; borderClass: string }> = {
  organizacion: {
    label: 'Organización de la Casa',
    icon: Home,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    borderClass: 'border-blue-300 bg-blue-50/30',
  },
  horarios: {
    label: 'Cambio de Horarios',
    icon: Clock,
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    borderClass: 'border-amber-300 bg-amber-50/30',
  },
  cocina: {
    label: 'Cocina y Comedor',
    icon: Utensils,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    borderClass: 'border-emerald-300 bg-emerald-50/30',
  },
  mantenimiento: {
    label: 'Mantenimiento y Averías',
    icon: Wrench,
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    borderClass: 'border-purple-300 bg-purple-50/30',
  },
  general: {
    label: 'General y Varios',
    icon: FileText,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    borderClass: 'border-slate-300 bg-slate-50/30',
  },
};

export const AdminAgendaView: React.FC<AdminAgendaViewProps> = ({
  notes,
  residents,
  selectedDay,
  onSelectDay,
  weekOffset,
  onSetWeekOffset,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onOpenAddModal,
  onEditNote,
  onDeleteNote,
  onToggleStatus,
  syncSource,
}) => {
  const [dateScope, setDateScope] = useState<'day' | 'week' | 'all'>('day');
  const [filterStatus, setFilterStatus] = useState<AdminNoteStatus | 'all'>('pendiente');
  const [filterCategory, setFilterCategory] = useState<AdminNoteCategory | 'all'>('all');
  const [filterAuthor, setFilterAuthor] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const currentDayISO = getDayISOString(selectedDay, weekOffset);
  const currentWeekDaysISO = useMemo(() => {
    return DAYS.map((d) => getDayISOString(d.id, weekOffset));
  }, [weekOffset]);

  // Notes count for each day of the selected week
  const dayNotesCount = useMemo(() => {
    const map: Record<DayOfWeek, number> = {
      lunes: 0,
      martes: 0,
      miercoles: 0,
      jueves: 0,
      viernes: 0,
      sabado: 0,
      domingo: 0,
    };
    DAYS.forEach((d) => {
      const iso = getDayISOString(d.id, weekOffset);
      map[d.id] = notes.filter((n) => n.targetDate === iso && n.status === 'pendiente').length;
    });
    return map;
  }, [notes, weekOffset]);

  // Filtered notes based on date scope, status, category, author, search
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // 1. Date scope filter (Strict paper-agenda date binding)
      if (dateScope === 'day') {
        // Only notes matching the selected day's ISO date
        if (note.targetDate !== currentDayISO) return false;
      } else if (dateScope === 'week') {
        // Notes matching any day of the active week
        if (!currentWeekDaysISO.includes(note.targetDate)) return false;
      }

      // 2. Status filter
      if (filterStatus !== 'all' && note.status !== filterStatus) return false;

      // 3. Category filter
      if (filterCategory !== 'all' && note.category !== filterCategory) return false;

      // 4. Author filter
      if (filterAuthor !== 'all' && note.author !== filterAuthor) return false;

      // 5. Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesDesc = (note.description || '').toLowerCase().includes(query);
        const matchesAuthor = note.author.toLowerCase().includes(query);
        const matchesDate = (note.targetDate || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesAuthor && !matchesDate) return false;
      }

      return true;
    });
  }, [notes, dateScope, currentDayISO, currentWeekDaysISO, filterStatus, filterCategory, filterAuthor, searchTerm]);

  // Stats for the active scope
  const activeScopePending = useMemo(() => {
    return filteredNotes.filter((n) => n.status === 'pendiente');
  }, [filteredNotes]);

  const activeScopeUrgent = useMemo(() => {
    return activeScopePending.filter((n) => n.priority === 'urgente');
  }, [activeScopePending]);

  // Copy structured summary for the telephone call with Director
  const handleCopyCallSummary = () => {
    const dateLabel = getDayFullFormatted(selectedDay, weekOffset);
    let text = `📞 *AGENDA ADMINISTRACIÓN - RESIDENCIA* (${dateLabel})\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const notesToExport = activeScopePending;

    if (notesToExport.length === 0) {
      text += `✅ No hay peticiones pendientes para la llamada de este día.\n`;
    } else {
      text += `📋 *PETICIONES PENDIENTES (${notesToExport.length}):*\n\n`;
      notesToExport.forEach((n, idx) => {
        const urgentFlag = n.priority === 'urgente' ? ' ⚠️ [URGENTE]' : '';
        const targetFormatted = n.targetDate ? formatDateDDMMYY(parseISODate(n.targetDate)) : '';
        text += `${idx + 1}. *[${n.author}]* ${n.title}${urgentFlag} (Fecha: ${targetFormatted})\n`;
        if (n.description) {
          text += `   ↳ _${n.description}_\n`;
        }
        text += `\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header & Main Controls */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-100 text-blue-900 font-bold rounded-lg text-xs flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" />
              Agenda de Peticiones y Avisos
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Vinculada estrictamente a fechas concretas
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Agenda Diaria para la Llamada con Administración
          </h2>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenAddModal(undefined, currentDayISO)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Anotar para {getDayDateOnly(selectedDay, weekOffset)}</span>
          </button>

          <button
            onClick={handleCopyCallSummary}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition ${
              copiedSummary
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
            title="Copiar texto para la llamada telefónica o WhatsApp"
          >
            {copiedSummary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSummary ? '¡Copiado!' : 'Copiar Agenda'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-slate-200"
            title="Imprimir agenda"
          >
            <Printer className="w-4 h-4" />
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

      {/* Date Scope Selector & Day Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          
          {/* Scope Mode tabs */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
            <button
              onClick={() => setDateScope('day')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                dateScope === 'day'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Día Concreto ({getDayShortFormatted(selectedDay, weekOffset)})</span>
            </button>

            <button
              onClick={() => setDateScope('week')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                dateScope === 'week'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Semana Activa</span>
            </button>

            <button
              onClick={() => setDateScope('all')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                dateScope === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Todas las Fechas</span>
            </button>
          </div>

          <div className="text-xs font-semibold text-slate-500 flex items-center gap-2 px-2">
            <span>Mostrando:</span>
            <span className="font-extrabold text-slate-800">
              {dateScope === 'day'
                ? getDayFullFormatted(selectedDay, weekOffset)
                : dateScope === 'week'
                ? getWeekRangeLabel(weekOffset)
                : 'Histórico global'}
            </span>
          </div>

        </div>

        {/* Day of week buttons (Available in 'day' and 'week' modes) */}
        {dateScope !== 'all' && (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {DAYS.map((d) => {
              const isSelected = d.id === selectedDay && dateScope === 'day';
              const isToday = isDayToday(d.id, weekOffset);
              const dateOnly = getDayDateOnly(d.id, weekOffset);
              const pendingCount = dayNotesCount[d.id];

              return (
                <button
                  key={d.id}
                  onClick={() => {
                    onSelectDay(d.id);
                    setDateScope('day');
                  }}
                  className={`p-2.5 rounded-xl text-center transition-all border flex flex-col items-center justify-between gap-1.5 relative ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                      : isToday
                      ? 'bg-blue-50/60 text-slate-800 border-blue-300 ring-1 ring-blue-400/40'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {isToday && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-blue-600 text-white text-[9px] font-black rounded-full shadow-2xs tracking-wide">
                      HOY
                    </span>
                  )}
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-bold">{d.short}</span>
                    <span className={`text-[10px] font-semibold ${isSelected ? 'text-blue-100' : isToday ? 'text-blue-800' : 'text-slate-500'}`}>
                      {dateOnly}
                    </span>
                  </div>

                  <span className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {d.label}
                  </span>

                  <div className="w-full pt-1 border-t border-slate-100/30 text-[10px] font-bold flex items-center justify-center">
                    {pendingCount > 0 ? (
                      <span className={`px-1.5 py-0.2 rounded-full font-black text-[9px] ${
                        isSelected ? 'bg-white text-blue-900' : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {pendingCount} {pendingCount === 1 ? 'nota' : 'notas'}
                      </span>
                    ) : (
                      <span className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-slate-300'}`}>
                        -
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por texto, asunto o residente..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Status filters */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => setFilterStatus('pendiente')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                filterStatus === 'pendiente' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendientes ({activeScopePending.length})</span>
            </button>

            <button
              onClick={() => setFilterStatus('transmitido')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                filterStatus === 'transmitido' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Transmitidos</span>
            </button>

            <button
              onClick={() => setFilterStatus('resuelto')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                filterStatus === 'resuelto' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resueltos</span>
            </button>

            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
          </div>

        </div>
      </div>

      {/* List of Notes */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">
              No hay anotaciones para {dateScope === 'day' ? getDayFullFormatted(selectedDay, weekOffset) : 'los filtros seleccionados'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Como en una agenda en blanco, las notas pertenecen estrictamente al día en que se registran para evitar confusiones.
            </p>
            <button
              onClick={() => onOpenAddModal(undefined, currentDayISO)}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir primera anotación para este día</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredNotes.map((note) => {
              const cat = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.general;
              const CatIcon = cat.icon;
              const isUrgent = note.priority === 'urgente';
              const targetFormatted = note.targetDate ? formatDateDDMMYY(parseISODate(note.targetDate)) : '';

              return (
                <div
                  key={note.id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 shadow-xs border transition hover:shadow-md ${
                    isUrgent && note.status === 'pendiente'
                      ? 'border-rose-300 ring-1 ring-rose-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    
                    {/* Main Note Content */}
                    <div className="space-y-2 flex-1">
                      
                      {/* Badge row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Author */}
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                          {note.author}
                        </span>

                        {/* Date badge */}
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-[11px] border border-slate-200 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Fecha: {targetFormatted}</span>
                        </span>

                        {/* Category */}
                        <span className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] border flex items-center gap-1 ${cat.badgeClass}`}>
                          <CatIcon className="w-3 h-3" />
                          <span>{cat.label}</span>
                        </span>

                        {/* Priority */}
                        {isUrgent && (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Urgente</span>
                          </span>
                        )}

                        {/* Status */}
                        {note.status === 'pendiente' && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 font-extrabold text-[10px]">
                            Pendiente Llamada
                          </span>
                        )}
                        {note.status === 'transmitido' && (
                          <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-200 font-extrabold text-[10px]">
                            Transmitido
                          </span>
                        )}
                        {note.status === 'resuelto' && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-200 font-extrabold text-[10px]">
                            Resuelto
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-base font-extrabold text-slate-900">
                        {note.title}
                      </h4>

                      {/* Description */}
                      {note.description && (
                        <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                          {note.description}
                        </p>
                      )}

                      {/* Response / Resolution note */}
                      {note.responseNotes && (
                        <div className="text-xs text-emerald-900 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block font-bold">Respuesta de Administración:</strong>
                            <span>{note.responseNotes}</span>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Action buttons on the card */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      
                      {/* State transition button */}
                      {note.status === 'pendiente' && (
                        <button
                          onClick={() => onToggleStatus(note, 'transmitido')}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          title="Marcar como transmitido en la llamada"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                          <span>Transmitir</span>
                        </button>
                      )}

                      {note.status === 'transmitido' && (
                        <button
                          onClick={() => onToggleStatus(note, 'resuelto')}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          title="Marcar como resuelto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Resolver</span>
                        </button>
                      )}

                      {note.status === 'resuelto' && (
                        <button
                          onClick={() => onToggleStatus(note, 'pendiente')}
                          className="px-2.5 py-1 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-medium transition"
                          title="Reabrir petición"
                        >
                          Reabrir
                        </button>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditNote(note)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="Editar nota"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Eliminar nota"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

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
