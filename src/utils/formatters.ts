export function formatARS(valor: number, compact = false): string {
  if (compact) {
    if (Math.abs(valor) >= 1_000_000_000)
      return `$${(valor / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(valor) >= 1_000_000)
      return `$${(valor / 1_000_000).toFixed(1)}M`;
    if (Math.abs(valor) >= 1_000)
      return `$${(valor / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatUSD(valor: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export function formatPorc(valor: number, decimales = 2): string {
  const signo = valor > 0 ? '+' : '';
  return `${signo}${(valor * 100).toFixed(decimales)}%`;
}

export function formatPorcRaw(valor: number, decimales = 2): string {
  return `${(valor * 100).toFixed(decimales)}%`;
}

export function formatFecha(fecha: string): string {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMesAnio(fecha: string): string {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    month: 'short',
    year: '2-digit',
  });
}

export function colorRendimiento(valor: number): string {
  if (valor > 0) return 'text-emerald-400';
  if (valor < 0) return 'text-red-400';
  return 'text-gray-400';
}

export function bgColorRendimiento(valor: number): string {
  if (valor > 0) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (valor < 0) return 'bg-red-500/10 text-red-400 border-red-500/20';
  return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
}

export function categoriaColor(cat: string): string {
  const map: Record<string, string> = {
    FCI: 'bg-blue-500/20 text-blue-300',
    CEDEAR: 'bg-violet-500/20 text-violet-300',
    Bono: 'bg-amber-500/20 text-amber-300',
    'Plazo Fijo': 'bg-orange-500/20 text-orange-300',
    Efectivo: 'bg-emerald-500/20 text-emerald-300',
    Accion: 'bg-pink-500/20 text-pink-300',
    Cripto: 'bg-yellow-500/20 text-yellow-300',
    Otro: 'bg-gray-500/20 text-gray-300',
  };
  return map[cat] ?? 'bg-gray-500/20 text-gray-300';
}
