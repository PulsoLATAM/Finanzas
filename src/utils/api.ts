import { useStore } from '../store/useStore';

export async function fetchDolarMEP(): Promise<number | null> {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/mep', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return (data.venta + data.compra) / 2;
  } catch {
    return null;
  }
}

export async function fetchInflacionMensual(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELGB_DICI_M_26&limit=2&format=json',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const valores: [string, number][] = data?.data;
    if (Array.isArray(valores) && valores.length > 0) {
      return valores[0][1] / 100;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchSPYBA(): Promise<number | null> {
  try {
    const res = await fetch('/api/spy-price', {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return typeof data.price === 'number' ? data.price : null;
  } catch {
    return null;
  }
}

export async function actualizarDatosMacro(): Promise<{
  dolar: boolean;
  inflacion: boolean;
  spy: boolean;
  spyPrecio: number | null;
}> {
  const { setDatosMacro, inversiones, actualizarValorInversion } =
    useStore.getState();

  const [dolar, inflacion, spyPrecio] = await Promise.all([
    fetchDolarMEP(),
    fetchInflacionMensual(),
    fetchSPYBA(),
  ]);

  setDatosMacro({
    dolarMEP: dolar,
    inflacionMensual: inflacion,
    lastUpdated: new Date().toISOString(),
  });

  // Actualizar valor de la inversión con ticker SPY.BA
  if (spyPrecio !== null) {
    const spyInv = inversiones.find((inv) => inv.ticker === 'SPY.BA');
    if (spyInv && spyInv.cantidad) {
      const nuevoValor = Math.round(spyPrecio * spyInv.cantidad);
      actualizarValorInversion(spyInv.id, nuevoValor);
    }
  }

  return {
    dolar: dolar !== null,
    inflacion: inflacion !== null,
    spy: spyPrecio !== null,
    spyPrecio,
  };
}
