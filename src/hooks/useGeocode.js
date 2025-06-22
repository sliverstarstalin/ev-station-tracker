import { useState } from 'react';

export default function useGeocode() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function geocode(query) {
    if (!query.trim()) return null;
    setLoading(true); setError('');
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?' +
        new URLSearchParams({ format: 'json', q: `${query}, India`, limit: 1 });
      const res = await fetch(url);
      const js  = await res.json();
      if (Array.isArray(js) && js.length) {
        return { lat: +js[0].lat, lon: +js[0].lon };
      }
      setError('Location not found');
      return null;
    } catch (e) {
      console.error(e);
      setError('Geocoding failed');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { geocode, loading, error };
}
