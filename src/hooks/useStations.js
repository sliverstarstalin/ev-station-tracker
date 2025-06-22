import { useState, useEffect } from 'react';

const API = 'https://api.openchargemap.io/v3/poi/';
const DEFAULT_RADIUS_KM = 25;

export default function useStations({ lat, lon, radius = DEFAULT_RADIUS_KM }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lat == null || lon == null) return;
    async function run() {
      setLoading(true);
      setError('');
      const url = new URL(API);
      url.searchParams.set('output', 'json');
      url.searchParams.set('countrycode', 'IN');
      url.searchParams.set('latitude', lat);
      url.searchParams.set('longitude', lon);
      url.searchParams.set('distance', radius);
      url.searchParams.set('distanceunit', 'KM');
      url.searchParams.set('maxresults', '100');
      if (import.meta.env.VITE_OCM_KEY) {
        url.searchParams.set('key', import.meta.env.VITE_OCM_KEY);
      }

      try {
        const resp = await fetch(url.toString());
        if (!resp.ok) throw new Error(`OCM ${resp.status}`);
        const data = await resp.json();
        setStations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError('Failed to load stations');
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [lat, lon, radius]);

  return { stations, loading, error };
}
