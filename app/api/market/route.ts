const API = 'https://api.robinhood.com/rhj';

export async function GET(request: Request) {
  const symbol = new URL(request.url).searchParams.get('symbol')?.toUpperCase();
  try {
    if (symbol) {
      const response = await fetch(`${API}/prices/${encodeURIComponent(symbol)}`, { headers: { Accept: 'application/json' } });
      if (!response.ok) return Response.json({ error: 'Robinhood market data is temporarily unavailable.' }, { status: 502 });
      return Response.json(await response.json(), { headers: { 'Cache-Control': 'public, max-age=15' } });
    }
    const [assetResponse, priceResponse] = await Promise.all([
      fetch(`${API}/assets`, { headers: { Accept: 'application/json' } }),
      fetch(`${API}/prices`, { headers: { Accept: 'application/json' } }),
    ]);
    if (!assetResponse.ok || !priceResponse.ok) return Response.json({ error: 'Robinhood market data is temporarily unavailable.' }, { status: 502 });
    const [{ assets }, { quotes }] = await Promise.all([assetResponse.json(), priceResponse.json()]);
    const prices = new Map((quotes as { tokenSymbol: string; bid: string; ask: string; generatedAt: string }[]).map(q => [q.tokenSymbol, q]));
    return Response.json({ assets: (assets as { tokenSymbol: string }[]).map(asset => ({ ...asset, quote: prices.get(asset.tokenSymbol) })) }, { headers: { 'Cache-Control': 'public, max-age=15' } });
  } catch (error) {
    console.error('Robinhood market proxy failed', error);
    return Response.json({ error: 'Robinhood market data is temporarily unavailable.' }, { status: 503 });
  }
}
