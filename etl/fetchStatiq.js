// etl/fetchStatiq.js  – 1° tiles, 500-safe
import fetch from 'node-fetch';
import { Agent } from 'https';

const ENDPOINT = 'https://backend.statiq.co.in/station/v1/markers';
const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'company-id': '90',
  Origin:  'https://www.statiq.in',
  Referer: 'https://www.statiq.in/',
};
const httpsAgent = new Agent({ rejectUnauthorized: false });

/* 1°×1° tiles covering lon 68–97, lat 8–37  ------------------------------ */
const TILES = [];
for (let lon = 68; lon < 97; lon += 1) {
  for (let lat = 8; lat < 37; lat += 1) {
    TILES.push([lon + 0.5, lat + 0.5]); // centre of each 1° box
  }
}

const bbox = (lon, lat) => [
  [lon - 0.5, lat - 0.5],
  [lon + 0.5, lat - 0.5],
  [lon + 0.5, lat + 0.5],
  [lon - 0.5, lat + 0.5],
  [lon - 0.5, lat - 0.5],
];

const num = (x) => (Number.isFinite(+x) ? +x : null);
const id  = (r) => `STATIQ_${r.station_id}`;
const norm = (r) => {
  const lat = num(r.latitude), lon = num(r.longitude);
  if (lat == null || lon == null) return null;
  return {
    id: id(r),
    source: 'STATIQ',
    name: r.station_name || 'Unnamed Statiq',
    network: 'Statiq',
    cost: r.cost_per_unit ? `₹${r.cost_per_unit}/kWh` : null,
    status: r.is_available ? 'operational' : 'offline',
    connections: [{
      type: r.connector_type,
      powerKW: num(r.power_rating_kw),
      qty: 1,
    }],
    lat, lon,
    address: r.address, city: r.city, state: r.state,
  };
};

/* fetch single tile with retry on 500 ------------------------------------ */
async function fetchTile(lon, lat, retries = 2) {
  const payload = JSON.stringify({
    latitude:  lon,
    longitude: lat,
    all_chargers: 1,
    connector_id: [],
    vertices: bbox(lon, lat),
  });

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST', headers: HEADERS, body: payload, agent: httpsAgent,
    });
    if (!res.ok) throw new Error(res.status);
    const j = await res.json();
    return j.data?.stations ?? [];
  } catch (err) {
    if (retries && String(err.message) === '500') {
      await new Promise(r => setTimeout(r, 500)); // 0.5 s back-off
      return fetchTile(lon, lat, retries - 1);
    }
    console.warn(`Tile ${lon.toFixed(1)},${lat.toFixed(1)} failed → ${err.message}`);
    return [];
  }
}

/* EXPORT ------------------------------------------------------------------ */
export async function fetchStatiq() {
  const batchSize = 100;
  const results = [];

  for (let i = 0; i < TILES.length; i += batchSize) {
    const chunk = TILES.slice(i, i + batchSize);
    const rows  = await Promise.all(chunk.map(([x, y]) => fetchTile(x, y)));
    results.push(...rows.flat());
    process.stdout.write(`\rStatiq tiles ${i + chunk.length}/${TILES.length}`);
  }
  console.log();

  const uniq = new Map(results.map(r => [r.station_id, r]));
  console.log(`Statiq raw ${results.length}, unique ${uniq.size}`);
  return [...uniq.values()].map(norm).filter(Boolean);
}
