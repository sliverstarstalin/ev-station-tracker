import React, { useState } from 'react';
import Landing from './components/Landing';
import Results from './components/Results';
import useGeocode from './hooks/useGeocode';
import useStations from './hooks/useStations';

export default function App() {
  const [phase, setPhase] = useState('landing');   // 'landing' | 'results'
  const [query, setQuery] = useState('');
  const [center, setCenter] = useState([22.9734, 78.6569]);

  const { geocode, loading: geocoding } = useGeocode();
  const stationsState = useStations({ lat: center[0], lon: center[1] });

  async function handleSearch(e) {
    e.preventDefault();
    const q = new FormData(e.target).get('q');
    if (!q) return;
    const loc = await geocode(q);
    if (!loc) return;
    setQuery(q);
    setCenter([loc.lat, loc.lon]);
    setPhase('results');
  }

  return phase === 'landing' ? (
    <Landing onSearch={handleSearch} geocoding={geocoding} />
  ) : (
    <Results
      query={query}
      center={center}
      stationsState={stationsState}
      onBack={() => setPhase('landing')}
    />
  );
}
