import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Inversion,
  Prestamo,
  SnapshotMensual,
  MacroConfig,
  AlertaConfig,
  Alerta,
  DatosMacro,
} from '../types';

const INV_INICIALES: Inversion[] = [
  {
    id: '1',
    nombre: 'IEB Multiestrategia V',
    categoria: 'FCI',
    broker: 'IEB',
    fechaCompra: '2026-04-27',
    montoInicial: 23028994.36,
    moneda: 'ARS',
    valorActual: 23456854.0,
    rendimientoEsperado: 0.409,
    notas: 'Monitorear mensualmente. Salir si 2 meses negativos.',
    historialValores: [
      { fecha: '2026-04-27', valor: 23028994.36 },
      { fecha: '2026-05-22', valor: 23456854.0 },
    ],
  },
  {
    id: '2',
    nombre: 'CEDEAR SPY',
    categoria: 'CEDEAR',
    ticker: 'SPY.BA',
    broker: 'IEB',
    fechaCompra: '2026-04-27',
    montoInicial: 4969202.25,
    cantidad: 94,
    precioCompra: 52864.91,
    moneda: 'ARS',
    valorActual: 5053100.0,
    rendimientoEsperado: 0.265,
    notas: 'Upside si dólar salta',
    historialValores: [
      { fecha: '2026-04-27', valor: 4969202.25 },
      { fecha: '2026-05-22', valor: 5053100.0 },
    ],
  },
  {
    id: '3',
    nombre: 'Liquidez USD',
    categoria: 'Efectivo',
    broker: 'IEB',
    fechaCompra: '2026-04-27',
    montoInicial: 6000000,
    moneda: 'ARS',
    cantidadUSD: 4285.71,
    valorActual: 6000000,
    rendimientoEsperado: 0.15,
    notas: 'Para cuotas meses 1-7',
    historialValores: [
      { fecha: '2026-04-27', valor: 6000000 },
      { fecha: '2026-05-22', valor: 6000000 },
    ],
  },
  {
    id: '4',
    nombre: 'FCI Mercado Pago',
    categoria: 'FCI',
    broker: 'Mercado Pago',
    fechaCompra: '2026-04-27',
    montoInicial: 5000000,
    moneda: 'ARS',
    valorActual: 5000000,
    rendimientoEsperado: 0.28,
    notas: 'Para cuotas meses 8-13',
    historialValores: [
      { fecha: '2026-04-27', valor: 5000000 },
      { fecha: '2026-05-22', valor: 5000000 },
    ],
  },
];

const SNAPSHOTS_INICIALES: SnapshotMensual[] = [
  {
    fecha: '2026-04-30',
    patrimonio: 39000000,
    rendimientoMensual: 0,
    inflacionMensual: 0.018,
    dolarMEP: 1400,
  },
  {
    fecha: '2026-05-22',
    patrimonio: 39509954,
    rendimientoMensual: 0.0221,
    inflacionMensual: 0.019,
    dolarMEP: 1430,
  },
];

const PRESTAMO_INICIAL: Prestamo = {
  monto: 40000000,
  tna: 0.063,
  plazo: 48,
  gracia: 12,
  cuotaMensual: 850000,
  fechaInicio: '2026-04-27',
  cuotasPagadas: 1,
};

const MACRO_INICIAL: MacroConfig = {
  inflacionAnual: 0.3,
  devaluacionAnual: 0.15,
  dolarMEP: 1400,
};

const ALERTAS_CONFIG_INICIAL: AlertaConfig = {
  rendimientoNegativo: true,
  rendimientoAnualizadoMinimo: 20,
  retornoRealNegativoMeses: 2,
  caida1DiaPorc: 5,
  dolarMEPUmbral: 1600,
  inflacionMensualUmbral: 3,
};

interface StoreState {
  inversiones: Inversion[];
  prestamo: Prestamo;
  snapshots: SnapshotMensual[];
  macroConfig: MacroConfig;
  alertaConfig: AlertaConfig;
  alertas: Alerta[];
  datosMacro: DatosMacro;
  darkMode: boolean;

  agregarInversion: (inv: Omit<Inversion, 'id' | 'historialValores'>) => void;
  editarInversion: (id: string, inv: Partial<Inversion>) => void;
  eliminarInversion: (id: string) => void;
  actualizarValorInversion: (id: string, valor: number) => void;

  setPrestamo: (p: Prestamo) => void;
  marcarCuotaPagada: () => void;

  agregarSnapshot: (s: SnapshotMensual) => void;
  updateMacroConfig: (config: Partial<MacroConfig>) => void;
  updateAlertaConfig: (config: Partial<AlertaConfig>) => void;

  setDatosMacro: (datos: Partial<DatosMacro>) => void;

  agregarAlerta: (a: Omit<Alerta, 'id' | 'fecha' | 'leida'>) => void;
  marcarAlertaLeida: (id: string) => void;
  limpiarAlertas: () => void;

  toggleDarkMode: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      inversiones: INV_INICIALES,
      prestamo: PRESTAMO_INICIAL,
      snapshots: SNAPSHOTS_INICIALES,
      macroConfig: MACRO_INICIAL,
      alertaConfig: ALERTAS_CONFIG_INICIAL,
      alertas: [],
      datosMacro: {
        dolarMEP: 1430,
        inflacionMensual: 0.019,
        lastUpdated: null,
      },
      darkMode: true,

      agregarInversion: (inv) =>
        set((s) => ({
          inversiones: [
            ...s.inversiones,
            {
              ...inv,
              id: Date.now().toString(),
              historialValores: [{ fecha: inv.fechaCompra, valor: inv.montoInicial }],
            },
          ],
        })),

      editarInversion: (id, inv) =>
        set((s) => ({
          inversiones: s.inversiones.map((i) =>
            i.id === id ? { ...i, ...inv } : i
          ),
        })),

      eliminarInversion: (id) =>
        set((s) => ({
          inversiones: s.inversiones.filter((i) => i.id !== id),
        })),

      actualizarValorInversion: (id, valor) =>
        set((s) => {
          const hoy = new Date().toISOString().split('T')[0];
          return {
            inversiones: s.inversiones.map((i) => {
              if (i.id !== id) return i;
              const historial = i.historialValores.filter(
                (h) => h.fecha !== hoy
              );
              return {
                ...i,
                valorActual: valor,
                historialValores: [...historial, { fecha: hoy, valor }],
              };
            }),
          };
        }),

      setPrestamo: (p) => set({ prestamo: p }),

      marcarCuotaPagada: () =>
        set((s) => ({
          prestamo: {
            ...s.prestamo,
            cuotasPagadas: s.prestamo.cuotasPagadas + 1,
          },
        })),

      agregarSnapshot: (snap) =>
        set((s) => ({
          snapshots: [
            ...s.snapshots.filter((x) => x.fecha !== snap.fecha),
            snap,
          ].sort((a, b) => a.fecha.localeCompare(b.fecha)),
        })),

      updateMacroConfig: (config) =>
        set((s) => ({ macroConfig: { ...s.macroConfig, ...config } })),

      updateAlertaConfig: (config) =>
        set((s) => ({ alertaConfig: { ...s.alertaConfig, ...config } })),

      setDatosMacro: (datos) =>
        set((s) => ({ datosMacro: { ...s.datosMacro, ...datos } })),

      agregarAlerta: (a) =>
        set((s) => ({
          alertas: [
            {
              ...a,
              id: Date.now().toString(),
              fecha: new Date().toISOString(),
              leida: false,
            },
            ...s.alertas,
          ].slice(0, 50),
        })),

      marcarAlertaLeida: (id) =>
        set((s) => ({
          alertas: s.alertas.map((a) =>
            a.id === id ? { ...a, leida: true } : a
          ),
        })),

      limpiarAlertas: () => set({ alertas: [] }),

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    }),
    { name: 'finanzas-store-v1' }
  )
);
