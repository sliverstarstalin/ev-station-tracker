// etl/fetchTata.js  – Tata Power EZCharge (public JSON)
import fetch from 'node-fetch';

const URL = 'https://ev.tatapower.com/v1/app/map/charging-stations';

function makeId(cs) {
  return `TATA_${cs.csId ?? `${cs.latitude}_${cs.longitude}`}`;
}

function normalise(cs) {
  return {
    id: makeId(cs),
    source: 'TATA',
    name: cs.csName,
    network: 'Tata Power EZCharge',
    cost: cs.tariff ?? null,                    // e.g. "₹16/kWh"
    status: cs.inUseStatus ? 'operational' : 'offline',
    connections: cs.connectorDetails?.map((d) => ({
      type: d.connectorType,
      powerKW: +d.powerRatingKW || null,
      qty: +d.connectorCount   || 1,
    })) ?? [],
    lat: +cs.latitude,
    lon: +cs.longitude,
    address: cs.address,
    city: cs.city,
    state: cs.state,
  };
}

export async function fetchTata() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Tata HTTP ${res.status}`);
  const outer = await res.json();
  const list  = outer.data ?? [];
  console.log(`Tata Power rows: ${list.length}`);
  return list.map(normalise);
}
