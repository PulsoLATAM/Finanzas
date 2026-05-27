export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/SPY.BA?interval=1d&range=1d',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error(`Yahoo Finance HTTP ${response.status}`);

    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice ?? meta?.previousClose;

    if (!price) throw new Error('No se encontró precio en la respuesta');

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.json({
      price,
      symbol: 'SPY.BA',
      currency: meta?.currency ?? 'ARS',
      marketState: meta?.marketState ?? 'unknown',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
