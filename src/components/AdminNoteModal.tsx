import React, { useState, useEffect } from 'react';
import { X, ClipboardList, AlertTriangle, Clock, Home, Utensils, Wrench, FileText, CheckCircle2, User, Calendar } from 'lucide-react';
import { AdminNote, AdminNoteCategory, AdminNotePriority, AdminNoteStatus, Resident } from '../types';
import { formatDateToISO, formatDateDDMMYY, parseISODate } from '../utils/dateUtils';

interface AdminNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: AdminNote | null;
  residents: Resident[];
  initialAuthor?: string;
  initialDate?: string; // YYYY-MM-DD
  onSaveNote: (note: AdminNote) => void;
}

const CATEGORY_OPTIONS: { id: AdminNoteCategory; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
  { id: 'organizacion', label: 'Organización de la Casa', icon: Home, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'horarios', label: 'Cambio de Horarios', icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'cocina', label: 'Cocina / Comedor / Compras', icon: Utensils, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'mantenimiento', label: 'Mantenimiento / Averías', icon: Wrench, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 'general', label: 'General / Varios', icon: FileText, color: 'text-slate-700 bg-slate-50 border-slate-200' },
];

export const AdminNoteModal: React.FC<AdminNoteModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  residents,
  initialAuthor,
  initialDate,
  onSaveNote,
}) => {
  const defaultDate = initialDate || formatDateToISO(new Date());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AdminNoteCategory>('organizacion');
  const [author, setAuthor] = useState('ILC');
  const [priority, setPriority] = useState<AdminNotePriority>('normal');
  const [status, setStatus] = useState<AdminNoteStatus>('pendiente');
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [responseNotes, setResponseNotes] = useState('');

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setDescription(noteToEdit.description || '');
      setCategory(noteToEdit.category);
      setAuthor(noteToEdit.author);
      setPriority(noteToEdit.priority);
      setStatus(noteToEdit.status);
      setTargetDate(noteToEdit.targetDate || defaultDate);
      setResponseNotes(noteToEdit.responseNotes || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('organizacion');
      setAuthor(initialAuthor || residents[0]?.name || 'ILC');
      setPriority('normal');
      setStatus('pendiente');
      setTargetDate(initialDate || formatDateToISO(new Date()));
      setResponseNotes('');
    }
  }, [noteToEdit, initialAuthor, initialDate, defaultDate, residents, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const noteData: AdminNote = {
      id: noteToEdit ? noteToEdit.id : `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      author: author.trim() || 'Residente',
      priority,
      status,
      targetDate: targetDate || formatDateToISO(new Date()),
      createdAt: noteToEdit ? noteToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      calledInAt: status === 'transmitido' ? (noteToEdit?.calledInAt || new Date().toISOString()) : undefined,
      responseNotes: responseNotes.trim() || undefined,
    };

    onSaveNote(noteData);
    onClose();
  };

  const formattedTargetDate = targetDate ? formatDateDDMMYY(parseISODate(targetDate)) : '';

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {noteToEdit ? 'Editar Petición de Agenda' : 'Nueva Nota en Agenda de Administración'}
              </h3>
              <p className="text-xs text-slate-500">
                Vinculada a una fecha concreta para la llamada telefónica del director
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="admin-note-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* Fecha concreta de la nota */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                <span>Fecha Específica de la Nota (Agenda)</span>
              </label>
              <p className="text-[11px] text-blue-800/80">
                Esta nota solo se mostrará en el día correspondiente ({formattedTargetDate})
              </p>
            </div>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-white border border-blue-300 rounded-xl px-3 py-1.5 text-xs font-extrabold text-blue-950 focus:ring-2 focus:ring-blue-500 focus:outline-none shrink-0"
            />
          </div>

          {/* Título de la petición */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Petición / Asunto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Pedir ajuste de horario de cena, aviso de fontanero, falta de detergente..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Categoría del Asunto
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = category === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCategory(opt.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition text-xs font-semibold ${
                      isSelected
                        ? `${opt.color} ring-2 ring-blue-500 font-bold shadow-xs`
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quién lo anota & Prioridad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>Quién lo pide (Iniciales / Rol)</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <optgroup label="Residentes (Iniciales)">
                    {residents.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} (Residente {r.id})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Otros">
                    <option value="Director">Director</option>
                    <option value="Cocina">Cocina / Comedor</option>
                    <option value="Personal">Personal de Residencia</option>
                    <option value="Todos">Comunidad / Todos</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Prioridad / Urgencia</span>
              </label>
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                    priority === 'normal'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('urgente')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center flex items-center justify-center gap-1 ${
                    priority === 'urgente'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Urgente</span>
                </button>
              </div>
            </div>
          </div>

          {/* Estado actual */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Estado de la petición
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pendiente')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  status === 'pendiente'
                    ? 'bg-amber-100 border-amber-300 text-amber-900 ring-2 ring-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Pendiente</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('transmitido')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  status === 'transmitido'
                    ? 'bg-blue-100 border-blue-300 text-blue-900 ring-2 ring-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                <span>Transmitido</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('resuelto')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  status === 'resuelto'
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Resuelto</span>
              </button>
            </div>
          </div>

          {/* Descripción / Explicación */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Detalles / Explicación completa (Opcional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añade detalles útiles para que el director pueda explicarlo con precisión en la llamada..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Respuesta o resolución (si está resuelto o transmitido) */}
          {(status === 'resuelto' || status === 'transmitido' || noteToEdit?.responseNotes) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Respuesta / Resultado de la llamada (Opcional)
              </label>
              <textarea
                rows={2}
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder="Ej: La administración confirma que vendrá el técnico el martes a las 10:00..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            form="admin-note-form"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{noteToEdit ? 'Guardar Cambios' : 'Añadir a la Agenda'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
