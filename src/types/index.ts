export type Categoria =
  | 'FCI'
  | 'CEDEAR'
  | 'Bono'
  | 'Plazo Fijo'
  | 'Efectivo'
  | 'Accion'
  | 'Cripto'
  | 'Otro';

export type Moneda = 'ARS' | 'USD';

export interface ValorHistorico {
  fecha: string;
  valor: number;
}

export interface Inversion {
  id: string;
  nombre: string;
  categoria: Categoria;
  broker: string;
  fechaCompra: string;
  montoInicial: number;
  moneda: Moneda;
  valorActual: number;
  ticker?: string;
  cantidad?: number;
  precioCompra?: number;
  cantidadUSD?: number;
  rendimientoEsperado: number;
  notas?: string;
  historialValores: ValorHistorico[];
}

export interface Prestamo {
  monto: number;
  tna: number;
  plazo: number;
  gracia: number;
  cuotaMensual: number;
  fechaInicio: string;
  cuotasPagadas: number;
}

export interface SnapshotMensual {
  fecha: string;
  patrimonio: number;
  rendimientoMensual: number;
  inflacionMensual: number;
  dolarMEP: number;
  inversiones?: { id: string; valor: number; rendimiento: number }[];
}

export interface MacroConfig {
  inflacionAnual: number;
  devaluacionAnual: number;
  dolarMEP: number;
}

export interface AlertaConfig {
  rendimientoNegativo: boolean;
  rendimientoAnualizadoMinimo: number;
  retornoRealNegativoMeses: number;
  caida1DiaPorc: number;
  dolarMEPUmbral: number;
  inflacionMensualUmbral: number;
}

export interface Alerta {
  id: string;
  tipo: 'danger' | 'warning' | 'info';
  titulo: string;
  descripcion: string;
  fecha: string;
  leida: boolean;
}

export interface DatosMacro {
  dolarMEP: number | null;
  inflacionMensual: number | null;
  lastUpdated: string | null;
}

export interface CuotaPrestamo {
  mes: number;
  cuota: number;
  interes: number;
  amortizacion: number;
  saldo: number;
}
