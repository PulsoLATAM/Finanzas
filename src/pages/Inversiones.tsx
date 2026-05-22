import { useState, Fragment } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import InvestmentModal from '../components/InvestmentModal';
import type { Inversion, Categoria } from '../types';
import {
  formatARS,
  formatPorc,
  colorRendimiento,
  bgColorRendimiento,
  categoriaColor,
  formatFecha,
} from '../utils/formatters';
import { calcularRendimientoNominal, calcularRendimientoAnualizado } from '../utils/calculations';

type SortKey = 'nombre' | 'valorActual' | 'rendimiento' | 'categoria';

export default function Inversiones() {
  const { inversiones, eliminarInversion, actualizarValorInversion } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Inversion | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | ''>('');
  const [sortKey, setSortKey] = useState<SortKey>('valorActual');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editandoValor, setEditandoValor] = useState<{
    id: string;
    valor: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const categorias = [...new Set(inversiones.map((i) => i.categoria))];

  const filtered = inversiones
    .filter((inv) => {
      const matchBusqueda =
        inv.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        inv.broker.toLowerCase().includes(busqueda.toLowerCase()) ||
        (inv.ticker?.toLowerCase().includes(busqueda.toLowerCase()) ?? false);
      const matchCategoria =
        !filtroCategoria || inv.categoria === filtroCategoria;
      return matchBusqueda && matchCategoria;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'nombre') cmp = a.nombre.localeCompare(b.nombre);
      else if (sortKey === 'valorActual') cmp = a.valorActual - b.valorActual;
      else if (sortKey === 'rendimiento')
        cmp = calcularRendimientoNominal(a) - calcularRendimientoNominal(b);
      else if (sortKey === 'categoria')
        cmp = a.categoria.localeCompare(b.categoria);
      return sortAsc ? cmp : -cmp;
    });

  const totalPatrimonio = inversiones.reduce(
    (acc, inv) => acc + inv.valorActual,
    0
  );
  const totalInvertido = inversiones.reduce(
    (acc, inv) => acc + inv.montoInicial,
    0
  );
  const totalGanancia = totalPatrimonio - totalInvertido;

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function handleGuardarValor(id: string) {
    if (!editandoValor || editandoValor.id !== id) return;
    const v = parseFloat(editandoValor.valor.replace(',', '.'));
    if (!isNaN(v) && v > 0) {
      actualizarValorInversion(id, v);
    }
    setEditandoValor(null);
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k)
      return <ChevronDown size={12} className="text-gray-600" />;
    return sortAsc ? (
      <ChevronUp size={12} className="text-emerald-400" />
    ) : (
      <ChevronDown size={12} className="text-emerald-400" />
    );
  }

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Inversiones</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {inversiones.length} instrumento{inversiones.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setEditando(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Patrimonio</p>
          <p className="text-lg font-bold text-white">
            {formatARS(totalPatrimonio, true)}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Invertido</p>
          <p className="text-lg font-bold text-white">
            {formatARS(totalInvertido, true)}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Ganancia</p>
          <p
            className={`text-lg font-bold ${
              totalGanancia >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatARS(totalGanancia, true)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, broker, ticker..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value as Categoria | '')}
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th
                  className="text-left px-5 py-3 cursor-pointer select-none"
                  onClick={() => handleSort('nombre')}
                >
                  <span className="flex items-center gap-1 text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Instrumento <SortIcon k="nombre" />
                  </span>
                </th>
                <th className="text-right px-4 py-3">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Monto Inicial
                  </span>
                </th>
                <th
                  className="text-right px-4 py-3 cursor-pointer select-none"
                  onClick={() => handleSort('valorActual')}
                >
                  <span className="flex items-center justify-end gap-1 text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Valor Actual <SortIcon k="valorActual" />
                  </span>
                </th>
                <th
                  className="text-right px-4 py-3 cursor-pointer select-none"
                  onClick={() => handleSort('rendimiento')}
                >
                  <span className="flex items-center justify-end gap-1 text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Rendimiento <SortIcon k="rendimiento" />
                  </span>
                </th>
                <th className="text-right px-4 py-3">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Anualizado
                  </span>
                </th>
                <th className="text-right px-4 py-3">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Esperado
                  </span>
                </th>
                <th className="text-right px-5 py-3">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Acciones
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const rend = calcularRendimientoNominal(inv);
                const anualizado = calcularRendimientoAnualizado(inv);
                const ganancia = inv.valorActual - inv.montoInicial;
                const isExpanded = expandedId === inv.id;

                return (
                  <Fragment key={inv.id}>
                    <tr
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : inv.id)
                      }
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-1.5 h-8 rounded-full ${
                              rend >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          <div>
                            <p className="text-white font-semibold">{inv.nombre}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${categoriaColor(inv.categoria)}`}
                              >
                                {inv.categoria}
                              </span>
                              <span className="text-xs text-gray-600">
                                {inv.broker}
                              </span>
                              {inv.ticker && (
                                <span className="text-xs text-gray-600">
                                  · {inv.ticker}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-gray-400">
                        {formatARS(inv.montoInicial)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {editandoValor?.id === inv.id ? (
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="number"
                              value={editandoValor.valor}
                              onChange={(e) =>
                                setEditandoValor({
                                  id: inv.id,
                                  valor: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleGuardarValor(inv.id);
                                if (e.key === 'Escape') setEditandoValor(null);
                              }}
                              autoFocus
                              className="w-32 bg-gray-800 border border-emerald-500 rounded-lg px-2 py-1 text-sm text-white text-right focus:outline-none"
                            />
                            <button
                              onClick={() => handleGuardarValor(inv.id)}
                              className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <span
                            className="font-semibold text-white cursor-pointer hover:text-emerald-400 transition-colors"
                            title="Click para editar valor"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditandoValor({
                                id: inv.id,
                                valor: inv.valorActual.toString(),
                              });
                            }}
                          >
                            {formatARS(inv.valorActual)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-bold ${colorRendimiento(rend)}`}
                          >
                            {formatPorc(rend)}
                          </span>
                          <span className="text-xs text-gray-600">
                            {formatARS(ganancia, true)}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`px-4 py-4 text-right font-semibold ${colorRendimiento(anualizado)}`}
                      >
                        {formatPorc(anualizado)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-500">
                        {formatPorc(inv.rendimientoEsperado)}
                      </td>
                      <td className="px-5 py-4">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setEditando(inv);
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(inv.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-gray-800/50 bg-gray-800/20">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Fecha de compra
                              </p>
                              <p className="text-white">{formatFecha(inv.fechaCompra)}</p>
                            </div>
                            {inv.cantidad && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  Cantidad
                                </p>
                                <p className="text-white">{inv.cantidad} unidades</p>
                              </div>
                            )}
                            {inv.precioCompra && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  Precio compra
                                </p>
                                <p className="text-white">{formatARS(inv.precioCompra)}</p>
                              </div>
                            )}
                            {inv.cantidadUSD && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  USD en cartera
                                </p>
                                <p className="text-white">
                                  U$D {inv.cantidadUSD.toFixed(2)}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                vs. Esperado
                              </p>
                              <p
                                className={`font-semibold ${
                                  anualizado >= inv.rendimientoEsperado
                                    ? 'text-emerald-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {anualizado >= inv.rendimientoEsperado
                                  ? '▲ Por encima'
                                  : '▼ Por debajo'}{' '}
                                del esperado
                              </p>
                            </div>
                            {inv.notas && (
                              <div className="col-span-2 md:col-span-4">
                                <p className="text-xs text-gray-500 mb-1">Notas</p>
                                <p className="text-gray-300 text-sm">{inv.notas}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No se encontraron inversiones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-800">
          {filtered.map((inv) => {
            const rend = calcularRendimientoNominal(inv);
            return (
              <div key={inv.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold text-sm">{inv.nombre}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${categoriaColor(inv.categoria)}`}>
                        {inv.categoria}
                      </span>
                      <span className="text-xs text-gray-600">{inv.broker}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditando(inv);
                        setModalOpen(true);
                      }}
                      className="p-1.5 text-gray-500 hover:text-white"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(inv.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div>
                    <p className="text-[10px] text-gray-500">Invertido</p>
                    <p className="text-xs text-gray-400">{formatARS(inv.montoInicial, true)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Actual</p>
                    <p className="text-xs font-bold text-white">{formatARS(inv.valorActual, true)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Rendimiento</p>
                    <p className={`text-xs font-bold ${colorRendimiento(rend)}`}>
                      {formatPorc(rend)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-white font-bold mb-2">¿Eliminar inversión?</h3>
            <p className="text-gray-400 text-sm mb-5">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-800 text-gray-300 rounded-xl py-2.5 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  eliminarInversion(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2.5 text-sm font-bold"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <InvestmentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditando(null);
        }}
        editando={editando}
      />
    </div>
  );
}
