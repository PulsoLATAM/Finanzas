import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calcularMoM, calcularRendimientoReal } from '../utils/calculations';
import {
  formatPorc,
  formatARS,
  formatMesAnio,
  colorRendimiento,
} from '../utils/formatters';
import type { SnapshotMensual } from '../types';

const CustomBar = ({ x, y, width, height, value }: { x?: number; y?: number; width?: number; height?: number; value?: number }) => {
  const color = (value ?? 0) >= 0 ? '#10b981' : '#ef4444';
  const h = Math.abs(height ?? 0);
  const yPos = (value ?? 0) >= 0 ? (y ?? 0) : (y ?? 0) + (height ?? 0);
  return <rect x={x} y={yPos} width={width} height={h} fill={color} rx={4} />;
};

function SnapshotModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (s: SnapshotMensual) => void;
}) {
  const { inversiones, datosMacro, macroConfig } = useStore();
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    patrimonio: inversiones
      .reduce((a, inv) => a + inv.valorActual, 0)
      .toFixed(0),
    rendimientoMensual: '',
    inflacionMensual: (
      (datosMacro.inflacionMensual ?? macroConfig.inflacionAnual / 12) * 100
    ).toFixed(2),
    dolarMEP: (datosMacro.dolarMEP ?? macroConfig.dolarMEP).toFixed(0),
  });

  if (!open) return null;

  function handleSave() {
    onSave({
      fecha: form.fecha,
      patrimonio: Number(form.patrimonio),
      rendimientoMensual: Number(form.rendimientoMensual) / 100,
      inflacionMensual: Number(form.inflacionMensual) / 100,
      dolarMEP: Number(form.dolarMEP),
    });
    onClose();
  }

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-white font-bold mb-4">Agregar Snapshot</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Fecha</label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Patrimonio (ARS)
            </label>
            <input
              type="number"
              value={form.patrimonio}
              onChange={(e) =>
                setForm((f) => ({ ...f, patrimonio: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Rendimiento mensual %
            </label>
            <input
              type="number"
              value={form.rendimientoMensual}
              onChange={(e) =>
                setForm((f) => ({ ...f, rendimientoMensual: e.target.value }))
              }
              placeholder="Ej: 2.21"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">IPC %</label>
              <input
                type="number"
                value={form.inflacionMensual}
                onChange={(e) =>
                  setForm((f) => ({ ...f, inflacionMensual: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Dólar MEP</label>
              <input
                type="number"
                value={form.dolarMEP}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dolarMEP: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 text-gray-300 rounded-xl py-2.5 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 text-sm font-bold"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Comparaciones() {
  const { snapshots, agregarSnapshot } = useStore();
  const [snapshotModal, setSnapshotModal] = useState(false);

  const mom = useMemo(() => calcularMoM(snapshots), [snapshots]);

  const barData = useMemo(
    () =>
      mom.map((m) => ({
        mes: formatMesAnio(m.mes),
        rendimiento: parseFloat((m.rendimiento * 100).toFixed(3)),
        inflacion: parseFloat((m.inflacion * 100).toFixed(3)),
        real: parseFloat((m.retornoReal * 100).toFixed(3)),
      })),
    [mom]
  );

  const patrimonioData = useMemo(
    () =>
      snapshots.map((s) => ({
        mes: formatMesAnio(s.fecha),
        patrimonio: s.patrimonio,
        dolarMEP: s.dolarMEP,
      })),
    [snapshots]
  );

  const tooltipStyle = {
    contentStyle: {
      background: '#111827',
      border: '1px solid #374151',
      borderRadius: 12,
    },
    labelStyle: { color: '#9ca3af', fontSize: 12 },
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Comparaciones</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Análisis temporal mes a mes
          </p>
        </div>
        <button
          onClick={() => setSnapshotModal(true)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-xl text-sm font-medium transition-all"
        >
          <Plus size={15} />
          Snapshot
        </button>
      </div>

      {/* MoM bar chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">
          Rendimiento Mensual vs Inflación
        </h2>
        <p className="text-xs text-gray-500 mb-4">Nominal, real e IPC mensual</p>
        {barData.length < 2 ? (
          <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
            Agrega más snapshots para ver la comparación
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="mes"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v.toFixed(1)}%`}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(v: number, name: string) => [
                  `${v.toFixed(2)}%`,
                  name === 'rendimiento'
                    ? 'Rendimiento nominal'
                    : name === 'inflacion'
                    ? 'IPC'
                    : 'Retorno real',
                ]}
              />
              <Legend
                formatter={(v) =>
                  v === 'rendimiento'
                    ? 'Nominal'
                    : v === 'inflacion'
                    ? 'IPC'
                    : 'Real'
                }
                wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
              />
              <ReferenceLine y={0} stroke="#374151" />
              <Bar dataKey="rendimiento" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="inflacion" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="real" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Patrimonio evolution */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">
          Evolución Patrimonial
        </h2>
        <p className="text-xs text-gray-500 mb-4">ARS nominal</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={patrimonioData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="mes"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatARS(v, true)}
              width={55}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(v: number) => [formatARS(v), 'Patrimonio']}
            />
            <Line
              type="monotone"
              dataKey="patrimonio"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla detalle MoM */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">
            Detalle Mes a Mes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {[
                  'Período',
                  'Patrimonio',
                  'Rend. Nominal',
                  'vs Anterior',
                  'IPC',
                  'Rend. Real',
                  'Dólar MEP',
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider first:pl-5 last:pr-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...mom].reverse().map((m, i) => (
                <tr
                  key={m.mes}
                  className={`border-b border-gray-800/50 last:border-0 ${
                    i === 0 ? 'bg-emerald-500/5' : ''
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="text-white font-medium">
                        {formatMesAnio(m.mes)}
                      </p>
                      {i === 0 && (
                        <p className="text-[10px] text-emerald-500">Último</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-white font-medium">
                    {formatARS(m.patrimonio, true)}
                  </td>
                  <td
                    className={`px-4 py-3.5 font-bold ${colorRendimiento(m.rendimiento)}`}
                  >
                    {formatPorc(m.rendimiento)}
                  </td>
                  <td className="px-4 py-3.5">
                    {m.vsAnterior !== null ? (
                      <span
                        className={`text-sm font-medium ${
                          m.vsAnterior >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {m.vsAnterior >= 0 ? '▲' : '▼'}{' '}
                        {Math.abs(m.vsAnterior * 100).toFixed(2)}pp
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-amber-400">
                    {formatPorc(m.inflacion)}
                  </td>
                  <td
                    className={`px-4 py-3.5 font-semibold ${colorRendimiento(m.retornoReal)}`}
                  >
                    {formatPorc(m.retornoReal)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400">
                    ${m.dolarMEP.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen stats */}
      {mom.length >= 2 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(() => {
            const rends = mom.map((m) => m.rendimiento);
            const avg = rends.reduce((a, b) => a + b, 0) / rends.length;
            const max = Math.max(...rends);
            const min = Math.min(...rends);
            const realesPositivos = mom.filter((m) => m.retornoReal > 0).length;
            return (
              <>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Promedio mensual</p>
                  <p className={`text-lg font-bold ${colorRendimiento(avg)}`}>
                    {formatPorc(avg)}
                  </p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Mejor mes</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {formatPorc(max)}
                  </p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Peor mes</p>
                  <p className="text-lg font-bold text-red-400">
                    {formatPorc(min)}
                  </p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Meses reales +</p>
                  <p className="text-lg font-bold text-white">
                    {realesPositivos}/{mom.length}
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <SnapshotModal
        open={snapshotModal}
        onClose={() => setSnapshotModal(false)}
        onSave={(s) => {
          agregarSnapshot(s);
          setSnapshotModal(false);
        }}
      />
    </div>
  );
}
