import fetch from 'node-fetch';

export async function fetchOSM() {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="charging_station"](18,68,37,97);
      way["amenity"="charging_station"](18,68,37,97);
      relation["amenity"="charging_station"](18,68,37,97);
    );
    out center tags qt;`;
  const resp = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
  });
  const { elements } = await resp.json();

  return elements.map(n => ({
    id:      `OSM_${n.id}`,
    source:  'OSM',
    name:    n.tags.name ?? 'Unnamed charger',
    network: n.tags.operator ?? null,
    cost:    n.tags.fee === 'no' ? 'Free' : null,
    status:  'unknown',
    connections: [],
    lat: n.lat ?? n.center?.lat,
    lon: n.lon ?? n.center?.lon,
    address: n.tags['addr:street'] ?? null,
    city:    n.tags['addr:city'] ?? null,
    state:   n.tags['addr:state'] ?? null,
  }));
}
