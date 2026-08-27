import React, { useState } from 'react';
import { X, Key, Globe, CheckCircle2, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { SupabaseConfig } from '../types';
import { saveSupabaseConfig, testSupabaseConnection } from '../services/storageService';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: SupabaseConfig;
  onConfigUpdated: (newConfig: SupabaseConfig) => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onConfigUpdated,
}) => {
  const [url, setUrl] = useState(currentConfig.url || '');
  const [key, setKey] = useState(currentConfig.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection(url, key);
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = () => {
    const res = saveSupabaseConfig(url, key);
    onConfigUpdated({
      url: url.trim(),
      anonKey: key.trim(),
      isConfigured: res.isConfigured,
    });
    onClose();
  };

  const handleResetToLocal = () => {
    setUrl('');
    setKey('');
    saveSupabaseConfig('', '');
    onConfigUpdated({
      url: '',
      anonKey: '',
      isConfigured: false,
    });
    setTestResult({
      success: true,
      message: 'Modo local activado. Los datos se guardan en el almacenamiento local del navegador.',
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
        
        {/* Cabecera Modal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Conexión con Supabase</h3>
              <p className="text-xs text-slate-500">Sincronización en la nube para la residencia</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario de llaves */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>Project URL (SUPABASE_URL):</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://tu-proyecto.supabase.co"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              <span>Anon Public API Key (SUPABASE_KEY):</span>
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Resultado del Test */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            )}
            <p className="leading-relaxed font-medium">{testResult.message}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleResetToLocal}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition text-left"
          >
            Usar Modo Local
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !url || !key}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Comprobando...' : 'Probar'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Guardar y Aplicar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
