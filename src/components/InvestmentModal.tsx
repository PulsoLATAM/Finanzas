import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Inversion, Categoria, Moneda } from '../types';
import { useStore } from '../store/useStore';

interface Props {
  open: boolean;
  onClose: () => void;
  editando?: Inversion | null;
}

const CATEGORIAS: Categoria[] = [
  'FCI',
  'CEDEAR',
  'Bono',
  'Plazo Fijo',
  'Efectivo',
  'Accion',
  'Cripto',
  'Otro',
];

const EMPTY = {
  nombre: '',
  categoria: 'FCI' as Categoria,
  broker: '',
  fechaCompra: new Date().toISOString().split('T')[0],
  montoInicial: '',
  moneda: 'ARS' as Moneda,
  valorActual: '',
  ticker: '',
  cantidad: '',
  precioCompra: '',
  cantidadUSD: '',
  rendimientoEsperado: '',
  notas: '',
};

export default function InvestmentModal({ open, onClose, editando }: Props) {
  const { agregarInversion, editarInversion } = useStore();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY, string>>>({});

  useEffect(() => {
    if (editando) {
      setForm({
        nombre: editando.nombre,
        categoria: editando.categoria,
        broker: editando.broker,
        fechaCompra: editando.fechaCompra,
        montoInicial: editando.montoInicial.toString(),
        moneda: editando.moneda,
        valorActual: editando.valorActual.toString(),
        ticker: editando.ticker ?? '',
        cantidad: editando.cantidad?.toString() ?? '',
        precioCompra: editando.precioCompra?.toString() ?? '',
        cantidadUSD: editando.cantidadUSD?.toString() ?? '',
        rendimientoEsperado: (editando.rendimientoEsperado * 100).toString(),
        notas: editando.notas ?? '',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [editando, open]);

  if (!open) return null;

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof typeof EMPTY, string>> = {};
    if (!form.nombre.trim()) errs.nombre = 'Requerido';
    if (!form.broker.trim()) errs.broker = 'Requerido';
    if (!form.montoInicial || isNaN(Number(form.montoInicial)))
      errs.montoInicial = 'Monto inválido';
    if (!form.valorActual || isNaN(Number(form.valorActual)))
      errs.valorActual = 'Valor inválido';
    if (!form.rendimientoEsperado || isNaN(Number(form.rendimientoEsperado)))
      errs.rendimientoEsperado = 'Porcentaje inválido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const data = {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      broker: form.broker.trim(),
      fechaCompra: form.fechaCompra,
      montoInicial: Number(form.montoInicial),
      moneda: form.moneda,
      valorActual: Number(form.valorActual),
      ticker: form.ticker.trim() || undefined,
      cantidad: form.cantidad ? Number(form.cantidad) : undefined,
      precioCompra: form.precioCompra ? Number(form.precioCompra) : undefined,
      cantidadUSD: form.cantidadUSD ? Number(form.cantidadUSD) : undefined,
      rendimientoEsperado: Number(form.rendimientoEsperado) / 100,
      notas: form.notas.trim() || undefined,
    };
    if (editando) {
      editarInversion(editando.id, data);
    } else {
      agregarInversion(data);
    }
    onClose();
  }

  const field = (
    label: string,
    key: keyof typeof EMPTY,
    type = 'text',
    placeholder = ''
  ) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-gray-800 border rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
          errors[key] ? 'border-red-500' : 'border-gray-700'
        }`}
      />
      {errors[key] && (
        <p className="text-xs text-red-400 mt-1">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative bg-gray-900 border border-gray-700 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-5 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            {editando ? 'Editar Inversión' : 'Nueva Inversión'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Nombre */}
          {field('Nombre *', 'nombre', 'text', 'Ej: IEB Multiestrategia V')}

          {/* Categoría + Broker */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Categoría *
              </label>
              <select
                value={form.categoria}
                onChange={(e) => set('categoria', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {field('Broker / Plataforma *', 'broker', 'text', 'Ej: IEB')}
          </div>

          {/* Fecha + Moneda */}
          <div className="grid grid-cols-2 gap-3">
            {field('Fecha de compra *', 'fechaCompra', 'date')}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Moneda</label>
              <select
                value={form.moneda}
                onChange={(e) => set('moneda', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Monto inicial + Valor actual */}
          <div className="grid grid-cols-2 gap-3">
            {field('Monto inicial *', 'montoInicial', 'number', '23028994')}
            {field('Valor actual *', 'valorActual', 'number', '23456854')}
          </div>

          {/* Rendimiento esperado */}
          {field(
            'Rendimiento esperado anual % *',
            'rendimientoEsperado',
            'number',
            'Ej: 40.9'
          )}

          <div className="border-t border-gray-800 pt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Campos opcionales
            </p>
            {/* Ticker + Cantidad */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {field('Ticker', 'ticker', 'text', 'Ej: SPY.BA')}
              {field('Cantidad', 'cantidad', 'number', 'Ej: 94')}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {field('Precio de compra', 'precioCompra', 'number', '')}
              {field('Cantidad USD', 'cantidadUSD', 'number', '')}
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Notas</label>
              <textarea
                value={form.notas}
                onChange={(e) => set('notas', e.target.value)}
                rows={2}
                placeholder="Estrategia, condiciones de salida..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-5 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl py-2.5 text-sm font-medium transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 text-sm font-bold transition-all"
          >
            {editando ? 'Guardar cambios' : 'Agregar inversión'}
          </button>
        </div>
      </div>
    </div>
  );
}
