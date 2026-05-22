import { useState } from 'react';
import { Save, RotateCcw, AlertTriangle, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatPorc, formatARS } from '../utils/formatters';

export default function Configuracion() {
  const {
    macroConfig,
    updateMacroConfig,
    alertaConfig,
    updateAlertaConfig,
    datosMacro,
    inversiones,
    snapshots,
    agregarSnapshot,
  } = useStore();

  const [macro, setMacro] = useState({
    inflacionAnual: (macroConfig.inflacionAnual * 100).toFixed(1),
    devaluacionAnual: (macroConfig.devaluacionAnual * 100).toFixed(1),
    dolarMEP: macroConfig.dolarMEP.toString(),
  });

  const [alertas, setAlertas] = useState({
    rendimientoNegativo: alertaConfig.rendimientoNegativo,
    rendimientoAnualizadoMinimo: alertaConfig.rendimientoAnualizadoMinimo.toString(),
    retornoRealNegativoMeses: alertaConfig.retornoRealNegativoMeses.toString(),
    caida1DiaPorc: alertaConfig.caida1DiaPorc.toString(),
    dolarMEPUmbral: alertaConfig.dolarMEPUmbral.toString(),
    inflacionMensualUmbral: alertaConfig.inflacionMensualUmbral.toString(),
  });

  const [savedMacro, setSavedMacro] = useState(false);
  const [savedAlertas, setSavedAlertas] = useState(false);

  function handleSaveMacro() {
    updateMacroConfig({
      inflacionAnual: Number(macro.inflacionAnual) / 100,
      devaluacionAnual: Number(macro.devaluacionAnual) / 100,
      dolarMEP: Number(macro.dolarMEP),
    });
    setSavedMacro(true);
    setTimeout(() => setSavedMacro(false), 2000);
  }

  function handleSaveAlertas() {
    updateAlertaConfig({
      rendimientoNegativo: alertas.rendimientoNegativo,
      rendimientoAnualizadoMinimo: Number(alertas.rendimientoAnualizadoMinimo),
      retornoRealNegativoMeses: Number(alertas.retornoRealNegativoMeses),
      caida1DiaPorc: Number(alertas.caida1DiaPorc),
      dolarMEPUmbral: Number(alertas.dolarMEPUmbral),
      inflacionMensualUmbral: Number(alertas.inflacionMensualUmbral),
    });
    setSavedAlertas(true);
    setTimeout(() => setSavedAlertas(false), 2000);
  }

  function handleSnapshotMensual() {
    const patrimonio = inversiones.reduce(
      (acc, inv) => acc + inv.valorActual,
      0
    );
    const hoy = new Date().toISOString().split('T')[0];
    const ultimo = snapshots[snapshots.length - 1];
    const rendMensual =
      ultimo
        ? (patrimonio - ultimo.patrimonio) / ultimo.patrimonio
        : 0;

    agregarSnapshot({
      fecha: hoy,
      patrimonio,
      rendimientoMensual: rendMensual,
      inflacionMensual:
        datosMacro.inflacionMensual ?? macroConfig.inflacionAnual / 12,
      dolarMEP: datosMacro.dolarMEP ?? macroConfig.dolarMEP,
    });
  }

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Supuestos macro, alertas y preferencias
        </p>
      </div>

      {/* Datos en tiempo real */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">
          Datos Actuales (API)
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Dólar MEP</p>
            <p className="text-lg font-bold text-white">
              {datosMacro.dolarMEP
                ? `$${datosMacro.dolarMEP.toFixed(0)}`
                : 'Sin datos'}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">dolarapi.com</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">IPC Mensual</p>
            <p className="text-lg font-bold text-amber-400">
              {datosMacro.inflacionMensual
                ? formatPorc(datosMacro.inflacionMensual)
                : 'Sin datos'}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">INDEC / datos.gob.ar</p>
          </div>
        </div>
        {datosMacro.lastUpdated && (
          <p className="text-xs text-gray-600 mt-3">
            Última actualización:{' '}
            {new Date(datosMacro.lastUpdated).toLocaleString('es-AR')}
          </p>
        )}
        <div className="flex items-start gap-2 mt-3 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
          <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-400">
            Usa el botón <strong className="text-white">Actualizar</strong> en el
            header para obtener datos frescos de las APIs externas.
          </p>
        </div>
      </div>

      {/* Supuestos macro */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">
          Supuestos Macro
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Inflación proyectada anual %
            </label>
            <input
              type="number"
              value={macro.inflacionAnual}
              onChange={(e) =>
                setMacro((m) => ({ ...m, inflacionAnual: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Devaluación proyectada anual %
            </label>
            <input
              type="number"
              value={macro.devaluacionAnual}
              onChange={(e) =>
                setMacro((m) => ({ ...m, devaluacionAnual: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Dólar MEP referencia (ARS)
            </label>
            <input
              type="number"
              value={macro.dolarMEP}
              onChange={(e) =>
                setMacro((m) => ({ ...m, dolarMEP: e.target.value }))
              }
              className={inputClass}
            />
          </div>
        </div>
        <button
          onClick={handleSaveMacro}
          className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            savedMacro
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <Save size={14} />
          {savedMacro ? '¡Guardado!' : 'Guardar supuestos'}
        </button>
      </div>

      {/* Alertas config */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">
          Umbrales de Alertas
        </h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-white">Alerta rendimiento negativo</p>
              <p className="text-xs text-gray-500">
                Notificar si alguna inversión tiene rendimiento {"<"} 0
              </p>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                alertas.rendimientoNegativo ? 'bg-emerald-500' : 'bg-gray-700'
              }`}
              onClick={() =>
                setAlertas((a) => ({
                  ...a,
                  rendimientoNegativo: !a.rendimientoNegativo,
                }))
              }
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  alertas.rendimientoNegativo ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>

          {(
            [
              [
                'Rendimiento anualizado mínimo %',
                'rendimientoAnualizadoMinimo',
                'Alertar si anualizado < X%',
              ],
              [
                'Meses con retorno real negativo',
                'retornoRealNegativoMeses',
                'Alertar si retorno real negativo por N meses',
              ],
              [
                'Caída en un día %',
                'caida1DiaPorc',
                'Alertar si caída diaria > X%',
              ],
              [
                'Dólar MEP umbral (ARS)',
                'dolarMEPUmbral',
                'Alertar si MEP supera este valor',
              ],
              [
                'Inflación mensual umbral %',
                'inflacionMensualUmbral',
                'Alertar si IPC mensual supera X%',
              ],
            ] as [string, keyof typeof alertas, string][]
          ).map(([label, key, desc]) => (
            <div key={key}>
              <label className="text-xs text-gray-400 block mb-1">
                {label}
                <span className="text-gray-600 ml-1">— {desc}</span>
              </label>
              <input
                type="number"
                value={alertas[key] as string}
                onChange={(e) =>
                  setAlertas((a) => ({ ...a, [key]: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSaveAlertas}
          className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            savedAlertas
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <Save size={14} />
          {savedAlertas ? '¡Guardado!' : 'Guardar alertas'}
        </button>
      </div>

      {/* Datos y snapshots */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">
          Gestión de Datos
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gray-800 rounded-xl p-3">
            <div>
              <p className="text-sm text-white">Guardar snapshot manual</p>
              <p className="text-xs text-gray-500">
                Guarda el patrimonio y datos actuales como snapshot
              </p>
            </div>
            <button
              onClick={handleSnapshotMensual}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              Guardar
            </button>
          </div>

          <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-white font-medium">Snapshots guardados</p>
              <p className="text-xs text-gray-400">
                Tenés {snapshots.length} snapshot
                {snapshots.length !== 1 ? 's' : ''} guardado
                {snapshots.length !== 1 ? 's' : ''}. Los datos se persisten en
                el navegador (localStorage). Exportar antes de limpiar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info de la app */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Acerca de</h2>
        <div className="space-y-2 text-sm text-gray-400">
          <p>Finanzas AR v1.0 — Sistema de seguimiento de inversiones</p>
          <p>
            APIs usadas: dolarapi.com (MEP), datos.gob.ar/INDEC (inflación)
          </p>
          <p>
            Datos almacenados localmente en el navegador (localStorage). Sin
            servidor.
          </p>
          <p className="text-emerald-400">
            {inversiones.length} inversiones · {snapshots.length} snapshots ·{' '}
            {formatARS(
              inversiones.reduce((a, b) => a + b.valorActual, 0),
              true
            )}{' '}
            patrimonio total
          </p>
        </div>
      </div>
    </div>
  );
}
