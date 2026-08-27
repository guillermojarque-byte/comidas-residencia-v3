import React, { useState } from 'react';
import { X, Plane, Calendar, User, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { AbsenceRecord, Resident } from '../types';
import { formatDateToISO, parseISODate, formatDateDDMMYY } from '../utils/dateUtils';

interface AbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
  initialResidentId?: number;
  absences: AbsenceRecord[];
  onSaveAbsence: (absence: AbsenceRecord) => void;
  onDeleteAbsence: (absenceId: string) => void;
}

export const AbsenceModal: React.FC<AbsenceModalProps> = ({
  isOpen,
  onClose,
  residents,
  initialResidentId,
  absences,
  onSaveAbsence,
  onDeleteAbsence,
}) => {
  const todayISO = formatDateToISO(new Date());
  const tomorrowISO = formatDateToISO(new Date(Date.now() + 86400000 * 2));

  const [residentId, setResidentId] = useState<number>(initialResidentId || residents[0]?.id || 1);
  const [startDate, setStartDate] = useState<string>(todayISO);
  const [endDate, setEndDate] = useState<string>(tomorrowISO);
  const [reason, setReason] = useState<string>('Viaje / Fin de semana fuera');

  if (!isOpen) return null;

  const selectedResident = residents.find((r) => r.id === residentId) || residents[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    if (endDate < startDate) return;

    const newAbsence: AbsenceRecord = {
      id: `abs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      residentId: selectedResident.id,
      residentName: selectedResident.name,
      startDate,
      endDate,
      reason: reason.trim() || 'Ausencia / Viaje',
      createdAt: new Date().toISOString(),
    };

    onSaveAbsence(newAbsence);
    // Reset reason and keep modal open or user can close
    setReason('Viaje / Fin de semana fuera');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Gestionar Ausencias y Viajes
              </h3>
              <p className="text-xs text-slate-500">
                Anula automáticamente todos los servicios (Desayuno, Comida y Cena) en el intervalo indicado
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          
          {/* New Absence Form */}
          <form onSubmit={handleSubmit} className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 md:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold text-amber-900 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5" />
                <span>Registrar Nuevo Intervalo de Ausencia</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Resident selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  <span>Residente</span>
                </label>
                <select
                  value={residentId}
                  onChange={(e) => setResidentId(Number(e.target.value))}
                  className="w-full bg-white border border-amber-300/80 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Residente {r.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>Fecha de Inicio</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) {
                      setEndDate(e.target.value);
                    }
                  }}
                  className="w-full bg-white border border-amber-300/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>Fecha de Fin</span>
                </label>
                <input
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-amber-300/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

            </div>

            {/* Motivo / Razón */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Motivo / Observación del Viaje (Opcional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Viaje a casa, Prácticas de empresa, Examen fuera..."
                className="w-full bg-white border border-amber-300/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-amber-900 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                <span>Se marcarán automáticamente 0 raciones en todos los servicios de ese rango.</span>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
              >
                <Plane className="w-3.5 h-3.5" />
                <span>+ Guardar Ausencia</span>
              </button>
            </div>

          </form>

          {/* List of Registered Absences */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Ausencias y Viajes Registrados ({absences.length})</span>
              </h4>
            </div>

            {absences.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700">No hay ausencias programadas</p>
                <p className="text-[11px] text-slate-500">Todos los residentes están en su régimen habitual.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {absences.map((abs) => {
                  const startFormatted = formatDateDDMMYY(parseISODate(abs.startDate));
                  const endFormatted = formatDateDDMMYY(parseISODate(abs.endDate));
                  const isCurrentOrFuture = abs.endDate >= todayISO;

                  return (
                    <div
                      key={abs.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                          {abs.residentName}
                        </span>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900">
                              Residente {abs.residentName}
                            </span>
                            {isCurrentOrFuture ? (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                                ✈️ Activo / Próximo
                              </span>
                            ) : (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                Pasado
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">
                              📅 {startFormatted} al {endFormatted}
                            </span>
                            {abs.reason && (
                              <>
                                <span>•</span>
                                <span className="italic text-slate-500">{abs.reason}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteAbsence(abs.id)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                        title="Eliminar ausencia y restablecer servicios"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Las ausencias actualizan automáticamente el cómputo de raciones en cocina.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
