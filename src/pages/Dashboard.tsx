import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Banknote,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import StatCard from '../components/StatCard';
import {
  calcularPatrimonioTotal,
  calcularCostoTotal,
  calcularGananciaTotal,
  calcularRendimientoPonderado,
  calcularRendimientoAnualizadoPonderado,
  calcularRendimientoReal,
  calcularYTD,
  calcularInflacionAcumuladaAnual,
  distribucionPorCategoria,
  calcularMoM,
} from '../utils/calculations';
import {
  formatARS,
  formatUSD,
  formatPorc,
  formatMesAnio,
  colorRendimiento,
  categoriaColor,
} from '../utils/formatters';

const PIE_COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#f97316'];

const CustomTooltipARS = ({ active, payload }: { active?: boolean; payload?: { value: number; name: string }[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm">
      <p className="text-gray-400">{payload[0].name}</p>
      <p className="text-white font-bold">{formatARS(payload[0].value, true)}</p>
    </div>
  );
};

export default function Dashboard() {
  const { inversiones, snapshots, macroConfig, datosMacro } = useStore();

  const dolarRef = datosMacro.dolarMEP ?? macroConfig.dolarMEP;
  const inflMensual = datosMacro.inflacionMensual ?? macroConfig.inflacionAnual / 12;

  const patrimonioTotal = calcularPatrimonioTotal(inversiones);
  const costoTotal = calcularCostoTotal(inversiones);
  const gananciaTotal = calcularGananciaTotal(inversiones);
  const rendNominal = calcularRendimientoPonderado(inversiones);
  const rendAnualizado = calcularRendimientoAnualizadoPonderado(inversiones);
  const rendReal = calcularRendimientoReal(rendNominal, inflMensual);
  const ytd = calcularYTD(snapshots);
  const inflYTD = calcularInflacionAcumuladaAnual(snapshots);
  const rendRealYTD = calcularRendimientoReal(ytd, inflYTD);

  const patrimonioUSD = patrimonioTotal / dolarRef;

  const distribucion = useMemo(
    () => distribucionPorCategoria(inversiones),
    [inversiones]
  );

  const evolucion = useMemo(
    () =>
      snapshots.map((s) => ({
        mes: formatMesAnio(s.fecha),
        patrimonio: s.patrimonio,
        inflacion: s.inflacionMensual,
      })),
    [snapshots]
  );

  const mom = useMemo(() => calcularMoM(snapshots), [snapshots]);
  const ultimoMom = mom[mom.length - 1];
  const penultimoMom = mom.length > 1 ? mom[mom.length - 2] : null;

  const mejorInversion = inversiones.reduce(
    (best, inv) => {
      const r = (inv.valorActual - inv.montoInicial) / inv.montoInicial;
      const bestR = (best.valorActual - best.montoInicial) / best.montoInicial;
      return r > bestR ? inv : best;
    },
    inversiones[0]
  );

  const peorInversion = inversiones.reduce(
    (worst, inv) => {
      const r = (inv.valorActual - inv.montoInicial) / inv.montoInicial;
      const worstR = (worst.valorActual - worst.montoInicial) / worst.montoInicial;
      return r < worstR ? inv : worst;
    },
    inversiones[0]
  );

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        {gananciaTotal < 0 && (
          <div className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-medium">
            <AlertTriangle size={14} />
            Rendimiento negativo
          </div>
        )}
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          titulo="Patrimonio Total"
          valor={formatARS(patrimonioTotal, true)}
          subvalor={`≈ ${formatUSD(patrimonioUSD)}`}
          icon={<Banknote size={16} />}
          acento="emerald"
        />
        <StatCard
          titulo="Ganancia Total"
          valor={formatARS(gananciaTotal, true)}
          subvalor={`sobre ${formatARS(costoTotal, true)} invertido`}
          cambio={formatPorc(rendNominal)}
          cambioPositivo={gananciaTotal >= 0}
          icon={gananciaTotal >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          acento={gananciaTotal >= 0 ? 'emerald' : 'red'}
        />
        <StatCard
          titulo="Rend. Anualizado"
          valor={formatPorc(rendAnualizado)}
          subvalor="Ponderado por cartera"
          cambio={`Real: ${formatPorc(rendReal)}`}
          cambioPositivo={rendReal >= 0}
          icon={<Activity size={16} />}
          acento={rendAnualizado >= 0.2 ? 'emerald' : 'amber'}
        />
        <StatCard
          titulo="YTD 2026"
          valor={formatPorc(ytd)}
          subvalor={`vs inflación YTD ${formatPorc(inflYTD)}`}
          cambio={`Real YTD: ${formatPorc(rendRealYTD)}`}
          cambioPositivo={rendRealYTD >= 0}
          icon={<DollarSign size={16} />}
          acento={rendRealYTD >= 0 ? 'emerald' : 'red'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Pie chart */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Distribución de Cartera
          </h2>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={distribucion}
                  dataKey="valor"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  strokeWidth={0}
                >
                  {distribucion.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipARS />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1.5 mt-2">
              {distribucion.map((d, i) => (
                <div key={d.categoria} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-gray-400">{d.categoria}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">
                      {formatARS(d.valor, true)}
                    </span>
                    <span className="text-gray-500 w-10 text-right">
                      {(d.porcentaje * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Line chart */}
        <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Evolución Patrimonial
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={evolucion} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
                formatter={(v: number) => [formatARS(v, true), 'Patrimonio']}
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
      </div>

      {/* Inversiones tabla */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Mis Inversiones</h2>
          <a
            href="/inversiones"
            className="text-xs text-emerald-400 hover:text-emerald-300"
          >
            Ver todas →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">
                  Instrumento
                </th>
                <th className="text-right text-xs text-gray-500 font-medium px-4 py-3 hidden sm:table-cell">
                  Monto Inicial
                </th>
                <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">
                  Valor Actual
                </th>
                <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">
                  Rendimiento
                </th>
                <th className="text-right text-xs text-gray-500 font-medium px-5 py-3 hidden md:table-cell">
                  Rend. Esperado
                </th>
              </tr>
            </thead>
            <tbody>
              {inversiones.map((inv) => {
                const rend = (inv.valorActual - inv.montoInicial) / inv.montoInicial;
                return (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div>
                          <p className="text-white font-medium text-sm">
                            {inv.nombre}
                          </p>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${categoriaColor(inv.categoria)}`}
                          >
                            {inv.categoria}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-400 hidden sm:table-cell">
                      {formatARS(inv.montoInicial, true)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-white">
                      {formatARS(inv.valorActual, true)}
                    </td>
                    <td className={`px-4 py-3.5 text-right font-bold ${colorRendimiento(rend)}`}>
                      {formatPorc(rend)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-500 hidden md:table-cell">
                      {formatPorc(inv.rendimientoEsperado)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row: MoM + Mejor/Peor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MoM comparación rápida */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Comparación Mes a Mes
          </h2>
          <div className="space-y-2">
            {mom.slice(-3).reverse().map((m, i) => (
              <div
                key={m.mes}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${
                  i === 0 ? 'bg-gray-800' : 'bg-gray-800/40'
                }`}
              >
                <div>
                  <p className="text-xs text-gray-400">{formatMesAnio(m.mes)}</p>
                  {i === 0 && (
                    <p className="text-xs text-emerald-500 font-medium">Mes actual</p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${colorRendimiento(m.rendimiento)}`}>
                    {formatPorc(m.rendimiento)}
                  </p>
                  {m.vsAnterior !== null && (
                    <p
                      className={`text-xs ${
                        m.vsAnterior >= 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}
                    >
                      {m.vsAnterior >= 0 ? '▲' : '▼'}{' '}
                      {Math.abs(m.vsAnterior * 100).toFixed(2)}pp
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <a
            href="/comparaciones"
            className="block mt-3 text-center text-xs text-emerald-400 hover:text-emerald-300"
          >
            Ver análisis completo →
          </a>
        </div>

        {/* Mejor / peor activo */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Performance por Activo
          </h2>
          <div className="space-y-3">
            {inversiones
              .map((inv) => ({
                ...inv,
                rend: (inv.valorActual - inv.montoInicial) / inv.montoInicial,
              }))
              .sort((a, b) => b.rend - a.rend)
              .map((inv) => (
                <div key={inv.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-300 truncate">
                        {inv.nombre}
                      </span>
                      <span
                        className={`text-xs font-bold ml-2 ${colorRendimiento(inv.rend)}`}
                      >
                        {formatPorc(inv.rend)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          inv.rend >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.abs(inv.rend) * 1000
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">
                    {(
                      (inv.valorActual /
                        calcularPatrimonioTotal(inversiones)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
