import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useStore } from '../store/useStore';
import {
  calcularRendimientoAnualizadoPonderado,
  calcularRendimientoReal,
  calcularYTD,
} from '../utils/calculations';
import { formatPorc, colorRendimiento } from '../utils/formatters';

interface Benchmark {
  nombre: string;
  descripcion: string;
  rendAnual: number;
  fuente: string;
}

export default function Benchmarks() {
  const { inversiones, macroConfig, snapshots, datosMacro } = useStore();

  const inflAnual = macroConfig.inflacionAnual;
  const devalAnual = macroConfig.devaluacionAnual;
  const rendCartera = calcularRendimientoAnualizadoPonderado(inversiones);
  const ytdCartera = calcularYTD(snapshots);
  const rendRealCartera = calcularRendimientoReal(rendCartera, inflAnual);

  const BENCHMARKS: Benchmark[] = [
    {
      nombre: 'Mi Cartera',
      descripcion: 'Rendimiento anualizado ponderado actual',
      rendAnual: rendCartera,
      fuente: 'Calculado',
    },
    {
      nombre: 'BADLAR',
      descripcion: 'Tasa de interés para depósitos de +1M ARS',
      rendAnual: 0.32,
      fuente: 'BCRA estimado',
    },
    {
      nombre: 'Plazo Fijo UVA',
      descripcion: 'Inflación + 1% spread',
      rendAnual: inflAnual + 0.01,
      fuente: 'BCRA / INDEC',
    },
    {
      nombre: 'Dólar MEP',
      descripcion: 'Solo apreciación cambiaria',
      rendAnual: devalAnual,
      fuente: 'Config macro',
    },
    {
      nombre: 'Inflación (CER)',
      descripcion: 'Rendimiento real cero',
      rendAnual: inflAnual,
      fuente: 'INDEC proyectado',
    },
    {
      nombre: 'S&P 500 (USD)',
      descripcion: '~10% USD + devaluación',
      rendAnual: 0.1 + devalAnual,
      fuente: 'Estimado',
    },
    {
      nombre: 'Plazo Fijo ARS',
      descripcion: 'TNA ~ 30% anual',
      rendAnual: 0.30,
      fuente: 'BCRA',
    },
  ];

  const chartData = BENCHMARKS.map((b) => ({
    nombre: b.nombre === 'Mi Cartera' ? '★ Cartera' : b.nombre,
    rendimiento: parseFloat((b.rendAnual * 100).toFixed(2)),
    real: parseFloat(
      (calcularRendimientoReal(b.rendAnual, inflAnual) * 100).toFixed(2)
    ),
    esCartera: b.nombre === 'Mi Cartera',
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Benchmarks</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Comparación con alternativas de inversión
        </p>
      </div>

      {/* Mi cartera summary */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">
              Tu Cartera
            </p>
            <p className="text-3xl font-bold text-white">
              {formatPorc(rendCartera)}
            </p>
            <p className="text-sm text-gray-400 mt-1">Rendimiento anualizado</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Real anual</p>
              <p className={`text-lg font-bold ${colorRendimiento(rendRealCartera)}`}>
                {formatPorc(rendRealCartera)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">YTD</p>
              <p className={`text-lg font-bold ${colorRendimiento(ytdCartera)}`}>
                {formatPorc(ytdCartera)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">vs Inflación</p>
              <p
                className={`text-lg font-bold ${
                  rendCartera > inflAnual ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {rendCartera > inflAnual ? '▲' : '▼'}{' '}
                {formatPorc(Math.abs(rendCartera - inflAnual))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">
          Rendimiento Anual Nominal vs Real
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Inflación proyectada anual: {formatPorc(inflAnual)}
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 8, bottom: 20, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="nombre"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              angle={-25}
              textAnchor="end"
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: 12,
              }}
              labelStyle={{ color: '#9ca3af', fontSize: 12 }}
              formatter={(v: number, name: string) => [
                `${v.toFixed(2)}%`,
                name === 'rendimiento' ? 'Nominal' : 'Real',
              ]}
            />
            <ReferenceLine y={0} stroke="#374151" />
            <Bar
              dataKey="rendimiento"
              name="rendimiento"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="real"
              name="real"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla comparativa */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">
            Tabla Comparativa
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {[
                  'Instrumento',
                  'Rend. Nominal',
                  'Rend. Real',
                  'vs Inflación',
                  'vs Mi Cartera',
                  'Fuente',
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
              {BENCHMARKS.map((b, i) => {
                const rendReal = calcularRendimientoReal(b.rendAnual, inflAnual);
                const vsInflacion = b.rendAnual - inflAnual;
                const vsCartera = b.rendAnual - rendCartera;
                const esCartera = b.nombre === 'Mi Cartera';
                return (
                  <tr
                    key={b.nombre}
                    className={`border-b border-gray-800/50 last:border-0 ${
                      esCartera
                        ? 'bg-emerald-500/5'
                        : 'hover:bg-gray-800/30'
                    }`}
                  >
                    <td className="pl-5 pr-4 py-3.5">
                      <div>
                        <p className="text-white font-semibold flex items-center gap-1.5">
                          {esCartera && (
                            <span className="text-emerald-400">★</span>
                          )}
                          {b.nombre}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {b.descripcion}
                        </p>
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3.5 font-bold text-base ${colorRendimiento(b.rendAnual)}`}
                    >
                      {formatPorc(b.rendAnual)}
                    </td>
                    <td
                      className={`px-4 py-3.5 font-semibold ${colorRendimiento(rendReal)}`}
                    >
                      {formatPorc(rendReal)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-sm font-medium ${
                          vsInflacion >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {vsInflacion >= 0 ? '+' : ''}
                        {(vsInflacion * 100).toFixed(1)}pp
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {esCartera ? (
                        <span className="text-gray-600">—</span>
                      ) : (
                        <span
                          className={`text-sm font-medium ${
                            vsCartera >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {vsCartera >= 0 ? '+' : ''}
                          {(vsCartera * 100).toFixed(1)}pp
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">
                      {b.fuente}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-600 text-center pb-2">
        Los benchmarks de mercado son estimaciones. Los datos reales pueden diferir.
        Inflación proyectada usada: {formatPorc(inflAnual)} anual.
      </div>
    </div>
  );
}
