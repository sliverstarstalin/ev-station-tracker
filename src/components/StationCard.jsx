import React from 'react';
import { Card, CardContent, Button } from './Primitives';

/* -------------------------------------------------------------------------- */
/* Helper functions                                                            */
/* -------------------------------------------------------------------------- */

/** Return connector summary like:
 *  "CCS-2 • 60 kW ×2, Type-2 • 7 kW ×1"
 */
function summariseConnections(conns = []) {
  return conns
    .map((c) => {
      const kind = c.ConnectionType?.Title ?? 'Unknown';
      // Prefer explicit PowerKW, fall back to Level > PowerKW, else empty
      const kw =
        c.PowerKW ??
        c.Level?.PowerKW ??
        (c.Level?.Title || '')
          .replace(/[^\d.]/g, '')       // grab numbers from "Up to 22 kW"
          .trim();
      const qty = c.Quantity ?? 1;
      return `${kind}${kw ? ` • ${kw} kW` : ''} ×${qty}`;
    })
    .join(', ');
}

/** Dot + text badge: green when operational, red otherwise */
function StatusBadge({ station }) {
  const isOp = station.StatusType?.IsOperational === true;
  const text = station.StatusType?.Title ?? (isOp ? 'Operational' : 'Status n/a');
  const color = isOp ? 'bg-emerald-500' : 'bg-red-500';
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className={`w-2 h-2 ${color} rounded-full`} />
      {text}
    </span>
  );
}

/** Cost string: exact ₹/kWh or UsageType fallback */
function costText(station) {
  if (station.UsageCost) return station.UsageCost; // e.g. "₹25/kWh"
  if (station.UsageType?.Title) return station.UsageType.Title; // "Free", etc.
  return 'Cost n/a';
}

/* -------------------------------------------------------------------------- */
/* StationCard component                                                       */
/* -------------------------------------------------------------------------- */

export default function StationCard({ s }) {
  const gMaps = `https://www.google.com/maps/dir/?api=1&destination=${s.AddressInfo.Latitude},${s.AddressInfo.Longitude}`;

  return (
    <Card className="hover:ring-2 hover:ring-emerald-500 transition">
      <CardContent>
        {/* Header */}
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold leading-snug">
            {s.AddressInfo.Title}
          </h3>
          <StatusBadge station={s} />
        </div>

        {/* Address */}
        <p className="text-sm text-gray-600">
          {s.AddressInfo.AddressLine1}
          {s.AddressInfo.Town ? `, ${s.AddressInfo.Town}` : ''}
        </p>

        {/* Connector / power summary */}
        <p className="text-sm mt-1">{summariseConnections(s.Connections)}</p>

        {/* Meta row */}
        <p className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
          <span>{s.OperatorInfo?.Title ?? 'Unknown network'}</span>
          {s.Distance != null && <span>· {s.Distance.toFixed(1)} km</span>}
          <span>· {costText(s)}</span>
        </p>

        {/* Navigate */}
              <a
                  href={gMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-3 w-full px-4 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700"
              >
                  🚗 Navigate
              </a>
      </CardContent>
    </Card>
  );
}
