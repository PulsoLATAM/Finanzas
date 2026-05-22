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
    // INDEC via API de datos abiertos del gobierno
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

export async function actualizarDatosMacro(): Promise<{
  dolar: boolean;
  inflacion: boolean;
}> {
  const { setDatosMacro } = useStore.getState();
  const [dolar, inflacion] = await Promise.all([
    fetchDolarMEP(),
    fetchInflacionMensual(),
  ]);

  setDatosMacro({
    dolarMEP: dolar,
    inflacionMensual: inflacion,
    lastUpdated: new Date().toISOString(),
  });

  return { dolar: dolar !== null, inflacion: inflacion !== null };
}
