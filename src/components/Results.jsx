import React, { useMemo, useState } from 'react';
import StationCard from './StationCard';
import IndiaMap from './IndiaMap';

export default function Results({ query, center, stationsState, onBack }) {
  const { stations, loading, error } = stationsState;
  const [showMap, setShowMap] = useState(false);

  const sorted = useMemo(
    () => [...stations].sort((a, b) => (a.Distance ?? 0) - (b.Distance ?? 0)),
    [stations]
  );

  return (
    <section
      className={
        showMap
          ? 'min-h-screen grid lg:grid-cols-[420px_1fr]'
          : 'min-h-screen flex flex-col'
      }
    >
      {/* sidebar / header */}
      <div className="bg-white/90 backdrop-blur border-b lg:border-r p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="text-emerald-600">
            ← Back
          </button>

          <button
            onClick={() => setShowMap((v) => !v)}
            className="text-emerald-600"
          >
            {showMap ? 'Hide map' : 'Show map'}
          </button>
        </div>

        <h2 className="text-xl font-semibold">
          {query} – {stations.length} spot{stations.length !== 1 ? 's' : ''}
        </h2>

        {loading && <p className="mt-4">Scanning the grid…</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}

        <div className="mt-4 space-y-4">
          {sorted.map((s) => (
            <StationCard key={s.ID} s={s} />
          ))}
        </div>
      </div>

      {/* map column (hidden on toggle) */}
      {showMap && (
        <div className="h-[calc(100vh-0px)]">
          <IndiaMap center={center} onStationsLoaded={() => {}} />
        </div>
      )}
    </section>
  );
}
