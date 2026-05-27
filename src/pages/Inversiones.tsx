import { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import InvestmentModal from '../components/InvestmentModal';
import type { Inversion, Categoria } from '../types';
import {
  formatARS,
  formatPorc,
  colorRendimiento,
  categoriaColor,
  formatFecha,
} from '../utils/formatters';
import {
  calcularRendimientoNominal,
  calcularRendimientoAnualizado,
  calcularYTD_inversion,
  calcularYTC_inversion,
  calcularMTD,
} from '../utils/calculations';

// ─── Tarjeta de una inversión ─────────────────────────────────────────────
function InvCard({
  inv,
  onEdit,
  onDelete,
  onEditValor,
}: {
  inv: Inversion;
  onEdit: () => void;
  onDelete: () => void;
  onEditValor: (id: string, valor: string) => void;
}) {
  const [editandoValor, setEditandoValor] = useState(false);
  const [valorInput, setValorInput] = useState('');

  const rend = calcularRendimientoNominal(inv);
  const anualizado = calcularRendimientoAnualizado(inv);
  const ytd = calcularYTD_inversion(inv);
  const ytc = calcularYTC_inversion(inv);
  const mtd = calcularMTD(inv);
  const ganancia = inv.valorActual - inv.montoInicial;
  const dias = differenceInDays(new Date(), parseISO(inv.fechaCompra));

  // Precio por acción (solo CEDEARs con datos completos)
  const precioCom = inv.precioCompra ?? null;
  const precioAct =
    inv.cantidad && inv.cantidad > 0
      ? inv.valorActual / inv.cantidad
      : null;

  function handleGuardar() {
    const v = parseFloat(valorInput.replace(',', '.'));
    if (!isNaN(v) && v > 0) onEditValor(inv.id, valorInput);
    setEditandoValor(false);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-bold text-base leading-tight truncate">
              {inv.nombre}
            </h3>
            {inv.ticker && (
              <span className="text-xs text-gray-500 font-mono">{inv.ticker}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${categoriaColor(inv.categoria)}`}>
              {inv.categoria}
            </span>
            <span className="text-xs text-gray-600">{inv.broker}</span>
            <span className="text-xs text-gray-700">·</span>
            <span className="text-xs text-gray-600">
              desde {formatFecha(inv.fechaCompra)} ({dias}d)
            </span>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Precio por acción (si aplica) */}
      {precioCom && precioAct && inv.cantidad && (
        <div className="mx-4 mb-3 bg-gray-800/50 rounded-xl px-4 py-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
            Precio por acción ({inv.cantidad} acciones)
          </p>
          <div className="flex items-center gap-2">
            <div>
              <p className="text-xs text-gray-500">Compra</p>
              <p className="text-sm font-semibold text-gray-300">
                {formatARS(precioCom)}
              </p>
            </div>
            <ArrowRight size={14} className="text-gray-600 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Actual</p>
              <p className="text-sm font-bold text-white">
                {formatARS(precioAct)}
              </p>
            </div>
            <div className={`ml-auto text-right`}>
              <p className="text-xs text-gray-500">Dif/acción</p>
              <p className={`text-sm font-bold ${colorRendimiento(precioAct - precioCom)}`}>
                {precioAct >= precioCom ? '+' : ''}{formatARS(precioAct - precioCom)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Capital */}
      <div className="mx-4 mb-3 bg-gray-800/50 rounded-xl px-4 py-3">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
          Capital invertido
        </p>
        <div className="flex items-center gap-2">
          <div>
            <p className="text-xs text-gray-500">Compra</p>
            <p className="text-sm font-semibold text-gray-300">
              {formatARS(inv.montoInicial)}
            </p>
          </div>
          <ArrowRight size={14} className="text-gray-600 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Actual</p>
            {editandoValor ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={valorInput}
                  onChange={(e) => setValorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGuardar();
                    if (e.key === 'Escape') setEditandoValor(false);
                  }}
                  autoFocus
                  className="w-28 bg-gray-700 border border-emerald-500 rounded-lg px-2 py-0.5 text-sm text-white focus:outline-none"
                />
                <button
                  onClick={handleGuardar}
                  className="text-emerald-400 text-xs font-bold"
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setValorInput(inv.valorActual.toString());
                  setEditandoValor(true);
                }}
                className="text-sm font-bold text-white hover:text-emerald-400 transition-colors text-left"
                title="Tap para actualizar valor"
              >
                {formatARS(inv.valorActual)}
              </button>
            )}
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">Ganancia</p>
            <p className={`text-sm font-bold ${colorRendimiento(ganancia)}`}>
              {ganancia >= 0 ? '+' : ''}{formatARS(ganancia)}
            </p>
          </div>
        </div>
      </div>

      {/* Returns grid */}
      <div className="mx-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Período */}
        <div className="bg-gray-800/40 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">
            Período
          </p>
          <p className={`text-lg font-bold ${colorRendimiento(rend)}`}>
            {formatPorc(rend)}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">{dias} días</p>
        </div>

        {/* MTD */}
        <div className="bg-gray-800/40 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">
            Mes actual
          </p>
          {mtd !== null ? (
            <>
              <p className={`text-lg font-bold ${colorRendimiento(mtd)}`}>
                {formatPorc(mtd)}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">MTD</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-gray-600">—</p>
              <p className="text-[10px] text-gray-700 mt-0.5">comprada este mes</p>
            </>
          )}
        </div>

        {/* YTD */}
        <div className="bg-gray-800/40 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">
            YTD
          </p>
          <p className={`text-lg font-bold ${colorRendimiento(ytd)}`}>
            {formatPorc(ytd)}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">año a la fecha</p>
        </div>

        {/* YTC */}
        <div className="bg-gray-800/40 rounded-xl p-3 text-center border border-dashed border-gray-700">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">
            YTC
          </p>
          <p className={`text-lg font-bold ${colorRendimiento(ytc)}`}>
            {formatPorc(ytc)}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">proy. al 31/12</p>
        </div>
      </div>

      {/* Anualizado + Esperado */}
      <div className="border-t border-gray-800 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-gray-500">Anualizado: </span>
            <span className={`text-sm font-bold ${colorRendimiento(anualizado)}`}>
              {formatPorc(anualizado)}
            </span>
            <span className="text-xs text-gray-600">/año</span>
          </div>
          <div>
            <span className="text-xs text-gray-500">Esperado: </span>
            <span className="text-sm font-semibold text-gray-400">
              {formatPorc(inv.rendimientoEsperado)}
            </span>
            <span className="text-xs text-gray-600">/año</span>
          </div>
        </div>
        <div>
          {anualizado >= inv.rendimientoEsperado ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <TrendingUp size={12} /> Por encima del objetivo
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
              <TrendingDown size={12} /> Por debajo del objetivo
            </span>
          )}
        </div>
      </div>

      {/* Notas */}
      {inv.notas && (
        <div className="border-t border-gray-800 px-5 py-2.5">
          <p className="text-xs text-gray-500 italic">{inv.notas}</p>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function Inversiones() {
  const { inversiones, eliminarInversion, actualizarValorInversion } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Inversion | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | ''>('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const categorias = [...new Set(inversiones.map((i) => i.categoria))];

  const filtered = inversiones.filter((inv) => {
    const matchBusqueda =
      inv.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      inv.broker.toLowerCase().includes(busqueda.toLowerCase()) ||
      (inv.ticker?.toLowerCase().includes(busqueda.toLowerCase()) ?? false);
    const matchCategoria = !filtroCategoria || inv.categoria === filtroCategoria;
    return matchBusqueda && matchCategoria;
  });

  const totalPatrimonio = inversiones.reduce((a, b) => a + b.valorActual, 0);
  const totalInvertido = inversiones.reduce((a, b) => a + b.montoInicial, 0);
  const totalGanancia = totalPatrimonio - totalInvertido;

  function handleEditValor(id: string, valor: string) {
    const v = parseFloat(valor.replace(',', '.'));
    if (!isNaN(v) && v > 0) actualizarValorInversion(id, v);
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Inversiones</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {inversiones.length} instrumento{inversiones.length !== 1 ? 's' : ''} · tap en el valor para actualizarlo
          </p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Patrimonio</p>
          <p className="text-lg font-bold text-white">{formatARS(totalPatrimonio, true)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Invertido</p>
          <p className="text-lg font-bold text-white">{formatARS(totalInvertido, true)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Ganancia</p>
          <p className={`text-lg font-bold ${totalGanancia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatARS(totalGanancia, true)}
          </p>
        </div>
      </div>

      {/* Leyenda de métricas */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600 px-1">
        <span><span className="text-gray-400">Período</span> — rendimiento desde la fecha de compra</span>
        <span><span className="text-gray-400">MTD</span> — mes actual, desde el 1°</span>
        <span><span className="text-gray-400">YTD</span> — rendimiento acumulado este año</span>
        <span><span className="text-gray-400 border border-dashed border-gray-600 px-1 rounded">YTC</span> — proyección al 31/12 a ritmo actual</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar..."
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
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((inv) => (
          <InvCard
            key={inv.id}
            inv={inv}
            onEdit={() => { setEditando(inv); setModalOpen(true); }}
            onDelete={() => setConfirmDelete(inv.id)}
            onEditValor={handleEditValor}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            No se encontraron inversiones
          </div>
        )}
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-white font-bold mb-2">¿Eliminar inversión?</h3>
            <p className="text-gray-400 text-sm mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-800 text-gray-300 rounded-xl py-2.5 text-sm font-medium"
              >Cancelar</button>
              <button
                onClick={() => { eliminarInversion(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2.5 text-sm font-bold"
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <InvestmentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditando(null); }}
        editando={editando}
      />
    </div>
  );
}
