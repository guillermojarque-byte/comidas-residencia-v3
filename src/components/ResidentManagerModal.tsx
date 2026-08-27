import React, { useState } from 'react';
import { X, Users, Check, RotateCcw } from 'lucide-react';
import { Resident } from '../types';
import { INITIAL_RESIDENTS } from '../constants';

interface ResidentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
  onSaveResidents: (residents: Resident[]) => void;
}

export const ResidentManagerModal: React.FC<ResidentManagerModalProps> = ({
  isOpen,
  onClose,
  residents,
  onSaveResidents,
}) => {
  const [list, setList] = useState<Resident[]>(residents);

  if (!isOpen) return null;

  const handleChangeName = (id: number, name: string) => {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
  };

  const handleSave = () => {
    onSaveResidents(list);
    onClose();
  };

  const handleReset = () => {
    setList(INITIAL_RESIDENTS);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] flex flex-col">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Lista de Iniciales de Residentes</h3>
              <p className="text-xs text-slate-500">10 residentes identificados por iniciales</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {list.map((res) => (
            <div key={res.id} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {res.id}
              </span>
              <input
                type="text"
                value={res.name}
                onChange={(e) => handleChangeName(res.id, e.target.value.toUpperCase())}
                placeholder={`Iniciales (ej. ILC)`}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-black text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer 10 iniciales</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Guardar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
