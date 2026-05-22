import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CheckCircle, Circle, Edit2, AlertTriangle, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calcularTablaAmortizacion } from '../utils/calculations';
import { formatARS, formatPorc, formatFecha, formatPorcRaw } from '../utils/formatters';

export default function Prestamo() {
  const { prestamo, setPrestamo, marcarCuotaPagada, inversiones } = useStore();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    monto: prestamo.monto.toString(),
    tna: (prestamo.tna * 100).toString(),
    plazo: prestamo.plazo.toString(),
    gracia: prestamo.gracia.toString(),
    cuotaMensual: prestamo.cuotaMensual.toString(),
    fechaInicio: prestamo.fechaInicio,
    cuotasPagadas: prestamo.cuotasPagadas.toString(),
  });

  const { cuotaAmort, tabla } = useMemo(
    () =>
      calcularTablaAmortizacion(
        prestamo.monto,
        prestamo.tna,
        prestamo.plazo,
        prestamo.gracia
      ),
    [prestamo]
  );

  const patrimonioTotal = inversiones.reduce((acc, inv) => acc + inv.valorActual, 0);
  const saldoDeuda = tabla[prestamo.cuotasPagadas - 1]?.saldo ?? prestamo.monto;
  const patrimonioNeto = patrimonioTotal - saldoDeuda;
  const cuotasRestantes = prestamo.plazo - prestamo.cuotasPagadas;
  const totalIntereses = tabla.reduce((acc, c) => acc + c.interes, 0);
  const interesesPagados = tabla
    .slice(0, prestamo.cuotasPagadas)
    .reduce((acc, c) => acc + c.interes, 0);

  const rendimientoPromedio = inversiones.reduce(
    (acc, inv) => acc + inv.rendimientoEsperado * (inv.montoInicial / patrimonioTotal),
    0
  );
  const spreadAnual = rendimientoPromedio - prestamo.tna;

  // Comparación costo vs rendimiento por año
  const chartData = Array.from({ length: Math.min(12, prestamo.plazo) }, (_, i) => {
    const mes = i + 1;
    const cuota = tabla[i];
    return {
      mes: `M${mes}`,
      interes: Math.round(cuota?.interes ?? 0),
      amortizacion: Math.round(cuota?.amortizacion ?? 0),
    };
  });

  function handleSave() {
    setPrestamo({
      monto: Number(form.monto),
      tna: Number(form.tna) / 100,
      plazo: Number(form.plazo),
      gracia: Number(form.gracia),
      cuotaMensual: Number(form.cuotaMensual),
      fechaInicio: form.fechaInicio,
      cuotasPagadas: Number(form.cuotasPagadas),
    });
    setEditando(false);
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Préstamo</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Seguimiento de deuda y cuotas
          </p>
        </div>
        <button
          onClick={() => setEditando(true)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-xl text-sm font-medium"
        >
          <Edit2 size={14} />
          Editar
        </button>
      </div>

      {/* Stats del préstamo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Monto Original</p>
          <p className="text-lg font-bold text-white">
            {formatARS(prestamo.monto, true)}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Saldo Actual</p>
          <p className="text-lg font-bold text-red-400">
            {formatARS(saldoDeuda, true)}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Patrimonio Neto</p>
          <p
            className={`text-lg font-bold ${
              patrimonioNeto >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatARS(patrimonioNeto, true)}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">TNA / Spread</p>
          <p className="text-lg font-bold text-white">
            {formatPorcRaw(prestamo.tna)}
          </p>
          <p
            className={`text-xs mt-0.5 font-medium ${
              spreadAnual >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            Spread: {formatPorc(spreadAnual)}
          </p>
        </div>
      </div>

      {/* Progreso */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Progreso del Préstamo</h2>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>
              Cuotas pagadas:{' '}
              <span className="text-white font-bold">
                {prestamo.cuotasPagadas}
              </span>
            </span>
            <span>
              Restantes:{' '}
              <span className="text-white font-bold">{cuotasRestantes}</span>
            </span>
          </div>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{
              width: `${(prestamo.cuotasPagadas / prestamo.plazo) * 100}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>{((prestamo.cuotasPagadas / prestamo.plazo) * 100).toFixed(1)}% completado</span>
          <span>
            Total intereses: {formatARS(totalIntereses, true)} | Pagados:{' '}
            {formatARS(interesesPagados, true)}
          </span>
        </div>

        {/* Análisis costo vs rendimiento */}
        <div className="mt-4 p-3 bg-gray-800/50 rounded-xl">
          <div className="flex items-start gap-2">
            {spreadAnual > 0 ? (
              <TrendingUp size={16} className="text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle size={16} className="text-amber-400 mt-0.5" />
            )}
            <div>
              <p className="text-xs text-gray-300">
                <span className="font-semibold">
                  {spreadAnual > 0
                    ? 'La cartera supera el costo del préstamo'
                    : 'El costo del préstamo supera el rendimiento'}
                </span>
                {' — '}Rendimiento promedio ponderado{' '}
                <span className="text-emerald-400 font-bold">
                  {formatPorcRaw(rendimientoPromedio)}
                </span>{' '}
                vs TNA{' '}
                <span className="text-red-400 font-bold">
                  {formatPorcRaw(prestamo.tna)}
                </span>
                {'. '}
                Spread anual:{' '}
                <span
                  className={`font-bold ${
                    spreadAnual >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatPorc(spreadAnual)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart flujo */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">
          Flujo de cuotas (primeros 12 meses)
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
              contentStyle={{
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: 12,
              }}
              labelStyle={{ color: '#9ca3af', fontSize: 12 }}
              formatter={(v: number, name: string) => [
                formatARS(v),
                name === 'interes' ? 'Interés' : 'Amortización',
              ]}
            />
            <Legend
              formatter={(v) => (v === 'interes' ? 'Interés' : 'Amortización')}
              wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
            />
            <Bar dataKey="interes" stackId="a" fill="#ef4444" />
            <Bar dataKey="amortizacion" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla cuotas */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Tabla de Cuotas</h2>
          <button
            onClick={marcarCuotaPagada}
            disabled={prestamo.cuotasPagadas >= prestamo.plazo}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
          >
            Marcar próxima pagada
          </button>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="border-b border-gray-800">
                {['#', 'Estado', 'Tipo', 'Cuota', 'Interés', 'Amort.', 'Saldo'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider first:pl-5"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {tabla.map((c) => {
                const pagada = c.mes <= prestamo.cuotasPagadas;
                const esProxima = c.mes === prestamo.cuotasPagadas + 1;
                const esGracia = c.mes <= prestamo.gracia;
                return (
                  <tr
                    key={c.mes}
                    className={`border-b border-gray-800/40 last:border-0 ${
                      esProxima ? 'bg-amber-500/5 border-amber-500/20' : ''
                    } ${pagada ? 'opacity-50' : ''}`}
                  >
                    <td className="pl-5 pr-4 py-3 text-gray-400 font-mono">
                      {c.mes}
                    </td>
                    <td className="px-4 py-3">
                      {pagada ? (
                        <CheckCircle size={15} className="text-emerald-500" />
                      ) : esProxima ? (
                        <div className="flex items-center gap-1 text-amber-400">
                          <AlertTriangle size={13} />
                          <span className="text-xs">Próxima</span>
                        </div>
                      ) : (
                        <Circle size={15} className="text-gray-700" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          esGracia
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {esGracia ? 'Gracia' : 'Amort.'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {formatARS(c.cuota)}
                    </td>
                    <td className="px-4 py-3 text-red-400">
                      {formatARS(c.interes)}
                    </td>
                    <td className="px-4 py-3 text-emerald-400">
                      {c.amortizacion > 0 ? formatARS(c.amortizacion) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatARS(c.saldo, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setEditando(false)}
          />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-white font-bold mb-4">Editar Préstamo</h3>
            <div className="space-y-3">
              {(
                [
                  ['Monto (ARS)', 'monto', 'number'],
                  ['TNA %', 'tna', 'number'],
                  ['Plazo (meses)', 'plazo', 'number'],
                  ['Gracia (meses)', 'gracia', 'number'],
                  ['Cuota mensual', 'cuotaMensual', 'number'],
                  ['Fecha inicio', 'fechaInicio', 'date'],
                  ['Cuotas pagadas', 'cuotasPagadas', 'number'],
                ] as [string, keyof typeof form, string][]
              ).map(([label, key, type]) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 block mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setEditando(false)}
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
      )}
    </div>
  );
}
