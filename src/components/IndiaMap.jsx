import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import useStations from '../hooks/useStations';
import '../lib/fixLeafletIcons';           // ensures default markers load

const ZOOM = 6;                           // sensible India-wide default

/**
 * @param {{ center: [number, number], onStationsLoaded?: Function }} props
 */
export default function IndiaMap({ center, onStationsLoaded = () => {} }) {
  // Fetch stations for the given lat/lon
  const { stations, loading, error } = useStations({
    lat: center[0],
    lon: center[1],
  });

  // Bubble results up to the parent component
  useEffect(() => {
    onStationsLoaded({ stations, loading, error });
  }, [stations, loading, error, onStationsLoaded]);

  return (
    <MapContainer
      center={center}
      zoom={ZOOM}
      className="h-96 w-full rounded-2xl shadow"
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {stations.map((s) => (
        <Marker
          key={s.ID}
          position={[s.AddressInfo.Latitude, s.AddressInfo.Longitude]}
        >
          <Popup>
            <strong>{s.AddressInfo.Title}</strong>
            <br />
            {s.AddressInfo.AddressLine1}
            <br />
            {s.AddressInfo.Town}, {s.AddressInfo.StateOrProvince}
            <br />
            {s.Connections?.length ?? 0} port(s)
            {s.Distance && (
              <>
                <br />
                {s.Distance.toFixed(1)} km away
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
