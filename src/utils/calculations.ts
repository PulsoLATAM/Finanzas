import { differenceInDays, parseISO } from 'date-fns';
import type { Inversion, SnapshotMensual, CuotaPrestamo } from '../types';

export function calcularRendimientoNominal(inv: Inversion): number {
  if (inv.montoInicial === 0) return 0;
  return (inv.valorActual - inv.montoInicial) / inv.montoInicial;
}

export function calcularRendimientoAnualizado(inv: Inversion): number {
  const dias = differenceInDays(new Date(), parseISO(inv.fechaCompra));
  if (dias <= 0) return 0;
  const rend = calcularRendimientoNominal(inv);
  return Math.pow(1 + rend, 365 / dias) - 1;
}

export function calcularRendimientoReal(rendNominal: number, inflacion: number): number {
  return (1 + rendNominal) / (1 + inflacion) - 1;
}

export function calcularPatrimonioTotal(inversiones: Inversion[]): number {
  return inversiones.reduce((acc, inv) => acc + inv.valorActual, 0);
}

export function calcularCostoTotal(inversiones: Inversion[]): number {
  return inversiones.reduce((acc, inv) => acc + inv.montoInicial, 0);
}

export function calcularGananciaTotal(inversiones: Inversion[]): number {
  return calcularPatrimonioTotal(inversiones) - calcularCostoTotal(inversiones);
}

export function calcularRendimientoPonderado(inversiones: Inversion[]): number {
  const totalCosto = calcularCostoTotal(inversiones);
  if (totalCosto === 0) return 0;
  return inversiones.reduce((acc, inv) => {
    const peso = inv.montoInicial / totalCosto;
    return acc + peso * calcularRendimientoNominal(inv);
  }, 0);
}

export function calcularRendimientoAnualizadoPonderado(inversiones: Inversion[]): number {
  const totalCosto = calcularCostoTotal(inversiones);
  if (totalCosto === 0) return 0;
  return inversiones.reduce((acc, inv) => {
    const peso = inv.montoInicial / totalCosto;
    return acc + peso * calcularRendimientoAnualizado(inv);
  }, 0);
}

export function calcularTablaAmortizacion(
  monto: number,
  tna: number,
  plazo: number,
  gracia: number
): { cuotaAmort: number; tabla: CuotaPrestamo[] } {
  const tem = Math.pow(1 + tna, 1 / 12) - 1;
  const plazoAmort = plazo - gracia;
  const tabla: CuotaPrestamo[] = [];
  let saldo = monto;

  // Período de gracia — solo intereses
  for (let mes = 1; mes <= gracia; mes++) {
    const interes = saldo * tem;
    tabla.push({ mes, cuota: interes, interes, amortizacion: 0, saldo });
    saldo = saldo;
  }

  // Cuota francesa para período de amortización
  const saldoFinGracia = saldo;
  const cuotaAmort =
    plazoAmort > 0
      ? (saldoFinGracia * (tem * Math.pow(1 + tem, plazoAmort))) /
        (Math.pow(1 + tem, plazoAmort) - 1)
      : 0;

  for (let mes = gracia + 1; mes <= plazo; mes++) {
    const interes = saldo * tem;
    const amortizacion = cuotaAmort - interes;
    saldo = Math.max(0, saldo - amortizacion);
    tabla.push({ mes, cuota: cuotaAmort, interes, amortizacion, saldo });
  }

  return { cuotaAmort, tabla };
}

export function calcularMoM(
  snapshots: SnapshotMensual[]
): Array<{
  mes: string;
  rendimiento: number;
  vsAnterior: number | null;
  inflacion: number;
  retornoReal: number;
  patrimonio: number;
  dolarMEP: number;
}> {
  return snapshots.map((snap, i) => {
    const anterior = i > 0 ? snapshots[i - 1] : null;
    return {
      mes: snap.fecha,
      rendimiento: snap.rendimientoMensual,
      vsAnterior: anterior
        ? snap.rendimientoMensual - anterior.rendimientoMensual
        : null,
      inflacion: snap.inflacionMensual,
      retornoReal: calcularRendimientoReal(
        snap.rendimientoMensual,
        snap.inflacionMensual
      ),
      patrimonio: snap.patrimonio,
      dolarMEP: snap.dolarMEP,
    };
  });
}

export function calcularYTD(snapshots: SnapshotMensual[]): number {
  const anio = new Date().getFullYear().toString();
  const snapsAnio = snapshots.filter((s) => s.fecha.startsWith(anio));
  if (snapsAnio.length === 0) return 0;
  return snapsAnio.reduce(
    (acc, s) => (1 + acc) * (1 + s.rendimientoMensual) - 1,
    0
  );
}

export function calcularInflacionAcumuladaAnual(snapshots: SnapshotMensual[]): number {
  const anio = new Date().getFullYear().toString();
  const snapsAnio = snapshots.filter((s) => s.fecha.startsWith(anio));
  if (snapsAnio.length === 0) return 0;
  return snapsAnio.reduce(
    (acc, s) => (1 + acc) * (1 + s.inflacionMensual) - 1,
    0
  );
}

// Return desde el 1° de enero (o desde la compra si es más reciente)
export function calcularYTD_inversion(inv: Inversion): number {
  const hoy = new Date();
  const inicioAnio = `${hoy.getFullYear()}-01-01`;
  const refFecha = inv.fechaCompra > inicioAnio ? inv.fechaCompra : inicioAnio;

  const previos = inv.historialValores
    .filter((h) => h.fecha <= refFecha)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const valorRef = previos.length > 0 ? previos[0].valor : inv.montoInicial;
  if (valorRef === 0) return 0;
  return (inv.valorActual - valorRef) / valorRef;
}

// Proyección al 31/12 usando el ritmo anualizado actual
export function calcularYTC_inversion(inv: Inversion): number {
  const hoy = new Date();
  const finAnio = new Date(hoy.getFullYear(), 11, 31);
  const diasRestantes = differenceInDays(finAnio, hoy);
  if (diasRestantes <= 0) return 0;
  const rendAnualizado = calcularRendimientoAnualizado(inv);
  // Proyección del valor actual hasta fin de año
  return Math.pow(1 + rendAnualizado, diasRestantes / 365) - 1;
}

// Return desde el 1° del mes actual (usando historial)
export function calcularMTD(inv: Inversion): number | null {
  const hoy = new Date();
  const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;

  const previos = inv.historialValores
    .filter((h) => h.fecha < inicioMes)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (previos.length === 0) return null; // Comprada este mes, no hay referencia anterior
  return (inv.valorActual - previos[0].valor) / previos[0].valor;
}

export function distribucionPorCategoria(
  inversiones: Inversion[]
): { categoria: string; valor: number; porcentaje: number }[] {
  const total = calcularPatrimonioTotal(inversiones);
  const map: Record<string, number> = {};
  for (const inv of inversiones) {
    map[inv.categoria] = (map[inv.categoria] ?? 0) + inv.valorActual;
  }
  return Object.entries(map).map(([categoria, valor]) => ({
    categoria,
    valor,
    porcentaje: total > 0 ? valor / total : 0,
  }));
}
