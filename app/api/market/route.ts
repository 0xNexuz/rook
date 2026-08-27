const API = 'https://api.robinhood.com/rhj';

type Asset = { tokenSymbol: string } & Record<string, unknown>;
type Quote = { tokenSymbol: string; bid: string; ask: string; generatedAt: string };
type AssetPayload = { assets: Asset[] };
type PricePayload = { quotes: Quote[] };

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
    const [assetPayload, pricePayload] = await Promise.all([
      assetResponse.json() as Promise<AssetPayload>,
      priceResponse.json() as Promise<PricePayload>,
    ]);
    const prices = new Map(pricePayload.quotes.map(q => [q.tokenSymbol, q]));
    return Response.json({ assets: assetPayload.assets.map(asset => ({ ...asset, quote: prices.get(asset.tokenSymbol) })) }, { headers: { 'Cache-Control': 'public, max-age=15' } });
  } catch (error) {
    console.error('Robinhood market proxy failed', error);
    return Response.json({ error: 'Robinhood market data is temporarily unavailable.' }, { status: 503 });
  }
}
