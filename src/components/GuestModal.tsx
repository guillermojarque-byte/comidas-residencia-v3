import React, { useState } from 'react';
import { X, Users, Utensils, Calendar, UserCheck, AlertCircle, Plus, Check } from 'lucide-react';
import { DAYS, GUEST_MENU_LABELS, GUEST_SERVICE_LABELS } from '../constants';
import { DayOfWeek, GuestEntry, GuestMealType, GuestMenuType, GuestServiceMode, Resident } from '../types';
import { getDayDateOnly } from '../utils/dateUtils';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
  initialDay?: DayOfWeek;
  initialMealType?: GuestMealType;
  initialHostName?: string;
  onSaveGuest: (guest: GuestEntry) => void;
}

export const GuestModal: React.FC<GuestModalProps> = ({
  isOpen,
  onClose,
  residents,
  initialDay = 'lunes',
  initialMealType = 'comida',
  initialHostName = '',
  onSaveGuest,
}) => {
  const [day, setDay] = useState<DayOfWeek>(initialDay);
  const [mealType, setMealType] = useState<GuestMealType>(initialMealType);
  const [serviceMode, setServiceMode] = useState<GuestServiceMode>('comedor_1');
  const [count, setCount] = useState<number>(1);
  const [hostName, setHostName] = useState<string>(initialHostName || (residents[0]?.name ?? 'ILC'));
  const [menuType, setMenuType] = useState<GuestMenuType>('estandar');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (count < 1) return;

    const newGuest: GuestEntry = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      day,
      mealType,
      serviceMode: mealType === 'desayuno' ? 'comedor_1' : serviceMode,
      count: Number(count),
      hostName: hostName.trim() || 'General',
      menuType,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveGuest(newGuest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Registrar Comensal / Invitado</h3>
              <p className="text-xs text-slate-400">Añade comensales adicionales para cocina</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* 1. Día de la semana */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
              Día de la semana:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {DAYS.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setDay(d.id)}
                  className={`py-1.5 px-1 text-xs rounded-xl font-bold border transition flex flex-col items-center justify-center gap-0.5 ${
                    day === d.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span>{d.short}</span>
                  <span className={`text-[10px] font-semibold ${day === d.id ? 'text-emerald-300' : 'text-slate-500'}`}>
                    {getDayDateOnly(d.id)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Servicio de comida y Número de personas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Comida / Servicio:
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMealType('desayuno')}
                  className={`py-2 rounded-lg transition ${
                    mealType === 'desayuno' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ☕ Desayuno
                </button>
                <button
                  type="button"
                  onClick={() => setMealType('comida')}
                  className={`py-2 rounded-lg transition ${
                    mealType === 'comida' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🍲 Comida
                </button>
                <button
                  type="button"
                  onClick={() => setMealType('cena')}
                  className={`py-2 rounded-lg transition ${
                    mealType === 'cena' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌙 Cena
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Nº de Invitados / Platos:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-base font-extrabold text-slate-900 text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
                <span className="text-xs text-slate-500 font-medium">personas</span>
              </div>
            </div>
          </div>

          {/* 3. Modalidad / Turno (si no es desayuno) */}
          {mealType !== 'desayuno' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Modalidad de Servicio / Turno:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setServiceMode('comedor_1')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                    serviceMode === 'comedor_1'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>1er Turno</span>
                  <span className="block text-[10px] opacity-80 font-normal">En comedor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setServiceMode('comedor_2')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                    serviceMode === 'comedor_2'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>2º Turno</span>
                  <span className="block text-[10px] opacity-80 font-normal">Tarde</span>
                </button>

                <button
                  type="button"
                  onClick={() => setServiceMode('tupper')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                    serviceMode === 'tupper'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>Para llevar</span>
                  <span className="block text-[10px] opacity-80 font-normal">Tupper</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. Residente anfitrión y Menú */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Anfitrión / Residente:
              </label>
              <select
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Residencia (General)">Residencia (General)</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name} (Residente)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Tipo de Menú / Dieta:
              </label>
              <select
                value={menuType}
                onChange={(e) => setMenuType(e.target.value as GuestMenuType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {Object.entries(GUEST_MENU_LABELS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Observaciones */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
              Observaciones para cocina (Opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Familiares de ILC, o alergia específica..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Comensal Extra</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
