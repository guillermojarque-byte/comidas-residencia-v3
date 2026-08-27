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
  Share2,
  Calendar,
  MessageSquare,
  Sparkles,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminNote, AdminNoteCategory, AdminNoteStatus, Resident } from '../types';

interface AdminAgendaViewProps {
  notes: AdminNote[];
  residents: Resident[];
  onOpenAddModal: (author?: string) => void;
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
  onOpenAddModal,
  onEditNote,
  onDeleteNote,
  onToggleStatus,
  syncSource,
}) => {
  const [filterStatus, setFilterStatus] = useState<AdminNoteStatus | 'all'>('pendiente');
  const [filterCategory, setFilterCategory] = useState<AdminNoteCategory | 'all'>('all');
  const [filterAuthor, setFilterAuthor] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isCallingMode, setIsCallingMode] = useState(false);

  // Stats calculation
  const pendingNotes = useMemo(() => notes.filter((n) => n.status === 'pendiente'), [notes]);
  const urgentPending = useMemo(() => pendingNotes.filter((n) => n.priority === 'urgente'), [pendingNotes]);
  const transmittedNotes = useMemo(() => notes.filter((n) => n.status === 'transmitido'), [notes]);
  const resolvedNotes = useMemo(() => notes.filter((n) => n.status === 'resuelto'), [notes]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Status filter
      if (filterStatus !== 'all' && note.status !== filterStatus) return false;
      // Category filter
      if (filterCategory !== 'all' && note.category !== filterCategory) return false;
      // Author filter
      if (filterAuthor !== 'all' && note.author !== filterAuthor) return false;
      // Search term
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
  }, [notes, filterStatus, filterCategory, filterAuthor, searchTerm]);

  // Copy structured summary for the phone call or messaging
  const handleCopyCallSummary = () => {
    const todayStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    let text = `📞 *AGENDA ADMINISTRACIÓN - RESIDENCIA* (${todayStr})\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (pendingNotes.length === 0) {
      text += `✅ No hay peticiones pendientes para la llamada de hoy.\n`;
    } else {
      text += `📋 *PETICIONES PENDIENTES (${pendingNotes.length}):*\n\n`;
      pendingNotes.forEach((n, idx) => {
        const urgentFlag = n.priority === 'urgente' ? ' ⚠️ [URGENTE]' : '';
        const dateFlag = n.targetDate ? ` (Para: ${n.targetDate})` : '';
        text += `${idx + 1}. *[${n.author}]* ${n.title}${urgentFlag}${dateFlag}\n`;
        if (n.description) {
          text += `   ↳ _${n.description}_\n`;
        }
        text += `\n`;
      });
    }

    if (transmittedNotes.length > 0) {
      text += `\n🔵 *TRANSMITIDAS EN SEGUIMIENTO (${transmittedNotes.length}):*\n`;
      transmittedNotes.slice(0, 5).forEach((n, idx) => {
        text += `• [${n.author}] ${n.title}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsCalled = (note: AdminNote) => {
    onToggleStatus(note, 'transmitido');
    confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
  };

  const handleMarkAsResolved = (note: AdminNote) => {
    onToggleStatus(note, 'resuelto');
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Main Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Llamada Matutina del Director</span>
              </span>
              <span className="text-xs text-slate-400">Muro Compartido</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Agenda de Administración</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Espacio para que todos anotemos peticiones de <strong>organización de la casa</strong>, <strong>cambios de horarios</strong>, <strong>cocina</strong> o <strong>mantenimiento</strong> para que el director las pida por teléfono a la administración cada mañana.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onOpenAddModal()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm shadow-lg hover:shadow-blue-500/25 transition flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Anotar Petición</span>
            </button>

            <button
              onClick={() => setIsCallingMode(!isCallingMode)}
              className={`px-4 py-3 font-bold rounded-2xl text-xs sm:text-sm border transition flex items-center gap-2 shrink-0 ${
                isCallingMode 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' 
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <PhoneCall className="w-4 h-4 text-amber-300" />
              <span>{isCallingMode ? 'Salir de Modo Llamada' : 'Modo Llamada Matutina'}</span>
            </button>

            <button
              onClick={handleCopyCallSummary}
              className="p-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 rounded-2xl text-xs font-semibold transition flex items-center gap-1.5"
              title="Copiar resumen para WhatsApp / Notas"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedSummary ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 rounded-2xl text-xs font-semibold transition flex items-center gap-1.5 no-print"
              title="Imprimir agenda"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block font-medium">Pendientes para llamada</span>
              <span className="text-2xl font-black text-amber-400">{pendingNotes.length}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block font-medium">Urgentes</span>
              <span className="text-2xl font-black text-rose-400">{urgentPending.length}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block font-medium">Transmitidas / En curso</span>
              <span className="text-2xl font-black text-blue-400">{transmittedNotes.length}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block font-medium">Resueltas / Tramitadas</span>
              <span className="text-2xl font-black text-emerald-400">{resolvedNotes.length}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>

      {/* CALLING MODE SPECIAL BANNER (Focus View for Morning Call) */}
      {isCallingMode && (
        <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-3xl p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-300/40 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black animate-pulse">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Modo Checklist para la Llamada Matutina
                </h3>
                <p className="text-xs text-slate-600">
                  Haz clic en <span className="font-bold text-blue-700">"✓ Pedido por Teléfono"</span> en cada punto a medida que lo transmites en la llamada.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCallingMode(false)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto"
            >
              Cerrar Modo Checklist
            </button>
          </div>

          {pendingNotes.length === 0 ? (
            <div className="text-center py-6 bg-white/70 rounded-2xl border border-amber-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">¡Todo transmitido!</p>
              <p className="text-xs text-slate-500">No quedan peticiones pendientes para la llamada de hoy.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingNotes.map((note, index) => {
                const catCfg = CATEGORY_CONFIG[note.category];
                return (
                  <div
                    key={note.id}
                    className="bg-white rounded-2xl p-4 border border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-900 text-white">
                            {note.author}
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${catCfg.badgeClass}`}>
                            {catCfg.label}
                          </span>
                          {note.priority === 'urgente' && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-600 text-white flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>URGENTE</span>
                            </span>
                          )}
                          {note.targetDate && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700">
                              📅 {note.targetDate}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-slate-900">{note.title}</h4>
                        {note.description && (
                          <p className="text-xs text-slate-600">{note.description}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleMarkAsCalled(note)}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>✓ Pedido por Teléfono</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        
        {/* Row 1: Status tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none p-1 bg-slate-100/80 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('pendiente')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                filterStatus === 'pendiente'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendientes ({pendingNotes.length})</span>
            </button>

            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Todas ({notes.length})</span>
            </button>

            <button
              onClick={() => setFilterStatus('transmitido')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                filterStatus === 'transmitido'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Transmitidas ({transmittedNotes.length})</span>
            </button>

            <button
              onClick={() => setFilterStatus('resuelto')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                filterStatus === 'resuelto'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resueltas ({resolvedNotes.length})</span>
            </button>
          </div>

          {/* Quick search */}
          <div className="relative flex-1 sm:max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en la agenda..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 2: Secondary Category & Author Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          
          {/* Category filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Categoría:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as AdminNoteCategory | 'all')}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las Categorías</option>
              <option value="organizacion">Organización Casa</option>
              <option value="horarios">Cambios de Horario</option>
              <option value="cocina">Cocina y Comedor</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="general">General / Varios</option>
            </select>
          </div>

          {/* Author filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Autor:</span>
            <select
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los autores</option>
              <optgroup label="Residentes">
                {residents.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Otros">
                <option value="Director">Director</option>
                <option value="Cocina">Cocina</option>
                <option value="Personal">Personal</option>
              </optgroup>
            </select>
          </div>

          {(filterCategory !== 'all' || filterAuthor !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setFilterCategory('all');
                setFilterAuthor('all');
                setSearchTerm('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold underline ml-auto"
            >
              Limpiar filtros
            </button>
          )}

        </div>

      </div>

      {/* Grid of Notes */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-800">No hay peticiones con este filtro</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Puedes añadir una nueva petición o aviso para la llamada de administración pulsando el botón superior.
          </p>
          <button
            onClick={() => onOpenAddModal()}
            className="mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Anotar Nueva Petición</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const catCfg = CATEGORY_CONFIG[note.category];
            const isPending = note.status === 'pendiente';
            const isTransmitted = note.status === 'transmitido';
            const isResolved = note.status === 'resuelto';

            return (
              <div
                key={note.id}
                className={`bg-white rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  note.priority === 'urgente' && isPending
                    ? 'border-rose-300 ring-2 ring-rose-500/20'
                    : isResolved
                    ? 'border-slate-200 opacity-80 bg-slate-50/50'
                    : isTransmitted
                    ? 'border-blue-200 bg-blue-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Header of card */}
                <div className="space-y-3">
                  
                  {/* Tags row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Author badge */}
                      <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-slate-900 text-white flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{note.author}</span>
                      </span>

                      {/* Category badge */}
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${catCfg.badgeClass}`}>
                        {catCfg.label}
                      </span>
                    </div>

                    {/* Priority badge */}
                    {note.priority === 'urgente' ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-600 text-white flex items-center gap-1 shrink-0 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>URGENTE</span>
                      </span>
                    ) : (
                      note.targetDate && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600 truncate max-w-[120px]">
                          📅 {note.targetDate}
                        </span>
                      )
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className={`text-base font-black text-slate-900 leading-snug ${isResolved ? 'line-through text-slate-500' : ''}`}>
                      {note.title}
                    </h4>
                    {note.description && (
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                        {note.description}
                      </p>
                    )}
                  </div>

                  {/* Response / Follow up notes */}
                  {note.responseNotes && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-0.5">
                      <span className="font-bold block flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Respuesta / Tramitación</span>
                      </span>
                      <p className="font-medium text-emerald-950">{note.responseNotes}</p>
                    </div>
                  )}

                </div>

                {/* Footer of card */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                  
                  {/* Status Indicator & Timestamp */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>Pendiente llamada</span>
                        </span>
                      )}
                      {isTransmitted && (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          <PhoneCall className="w-3 h-3" />
                          <span>Pedido por teléfono</span>
                        </span>
                      )}
                      {isResolved && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Resuelto</span>
                        </span>
                      )}
                    </div>
                    <span>
                      {new Date(note.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center justify-between gap-2">
                    
                    {/* Primary Status action */}
                    {isPending ? (
                      <button
                        onClick={() => handleMarkAsCalled(note)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>✓ Pedir en Llamada</span>
                      </button>
                    ) : isTransmitted ? (
                      <button
                        onClick={() => handleMarkAsResolved(note)}
                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>✓ Marcar Resuelto</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleStatus(note, 'pendiente')}
                        className="flex-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition text-center"
                      >
                        Reabrir a Pendiente
                      </button>
                    )}

                    {/* Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditNote(note)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                        title="Editar petición"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Eliminar de la agenda"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Practical Tips Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <span>💡 Cómo funciona la Agenda de Administración</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Cualquier residente o encargado puede anotar dudas, compras o cambios. Por la mañana, el director abre esta pantalla o activa el <strong>Modo Llamada</strong> y pasa la lista directamente al personal de administración de la sede central o secretaría.
          </p>
        </div>
        <button
          onClick={() => onOpenAddModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shrink-0 shadow-sm"
        >
          + Añadir Petición
        </button>
      </div>

    </div>
  );
};
