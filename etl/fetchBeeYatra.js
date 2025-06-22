// etl/fetchBeeYatra.js  – works with lat/lng keys
import fetch from 'node-fetch';
import { Agent } from 'https';

const URL = 'https://evyatra.beeindia.gov.in/bee-ev-backend/getallPCSlatlng';

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function makeId(rec) {
  // prefer unique pcs_id; fallback to lat-lng pair
  return rec.pcs_id
    ? `BEE_${rec.pcs_id}`
    : `BEE_${rec.lat}_${rec.lng}`;
}

function normalise(r) {
  const lat = toNum(r.lat);
  const lon = toNum(r.lng);
  if (lat == null || lon == null) return null;      // skip rows with no coords

  return {
    id:       makeId(r),
    source:   'BEE',
    name:     r.station_name || 'Unnamed PCS',
    network:  r.operator_name || null,
    cost:     r.charging_cost || null,
    status:   (r.status || 'unknown').toLowerCase(),
    connections: [
      {
        type:    r.charging_type || null,
        powerKW: toNum(r.power_rating_kw),
        qty:     toNum(r.no_of_ports) || 1,
      },
    ],
    lat,
    lon,
    address:  r.address,
    city:     r.city,
    state:    r.state,
  };
}

export async function fetchBeeYatra() {
  const resp = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: '{}',                                         // site posts empty JSON
    agent: new Agent({ rejectUnauthorized: false }),    // bypass India-root CA gap
  });

  if (!resp.ok) throw new Error(`BEE HTTP ${resp.status}`);
  const top = await resp.json();

  if (!Array.isArray(top.value))
    throw new Error('BEE: expected .value array');

  const rows = top.value.map(normalise).filter(Boolean);
  console.log(`BeeYatra usable rows: ${rows.length}`);
  return rows;
}
