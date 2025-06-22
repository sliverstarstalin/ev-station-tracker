import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });
export async function fetchOCM() {
  const url = `https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&maxresults=5000&key=${process.env.OCM_KEY}`;
  const raw = await fetch(url).then(r => r.json());

  return raw.map(d => ({
    id: `OCM_${d.ID}`,
    source: 'OCM',
    name: d.AddressInfo.Title,
    network: d.OperatorInfo?.Title ?? null,
    cost: d.UsageCost ?? d.UsageType?.Title ?? null,
    status: d.StatusType?.IsOperational ? 'operational' : 'offline',
    connections: (d.Connections ?? []).map(c => ({
      type: c.ConnectionType?.Title,
      powerKW: c.PowerKW,
      qty: c.Quantity ?? 1,
    })),
    lat: d.AddressInfo.Latitude,
    lon: d.AddressInfo.Longitude,
    address: d.AddressInfo.AddressLine1,
    city: d.AddressInfo.Town,
    state: d.AddressInfo.StateOrProvince,
  }));
}
